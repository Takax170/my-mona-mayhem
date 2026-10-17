import { battleOutcome } from './battle-outcome.ts';

export interface BattlePlayer {
	username: string;
	totalContributions: number;
}

export interface BattleRecord {
	playedAt: string;
	players: readonly [BattlePlayer, BattlePlayer];
}

export const HISTORY_KEY = 'monaMayhemBattleHistory';
export const HISTORY_LIMIT = 20;

function isPlayer(value: unknown): value is BattlePlayer {
	if (typeof value !== 'object' || value === null) return false;
	const player = value as Record<string, unknown>;
	return typeof player.username === 'string' && player.username.length <= 39
		&& /^[a-z\d]+(?:-[a-z\d]+)*$/i.test(player.username)
		&& typeof player.totalContributions === 'number'
		&& Number.isSafeInteger(player.totalContributions) && player.totalContributions >= 0;
}

export function parseHistory(raw: string | null): BattleRecord[] {
	if (raw === null) return [];
	const data: unknown = JSON.parse(raw);
	if (!Array.isArray(data) || !data.every((record: unknown) => {
		if (typeof record !== 'object' || record === null) return false;
		const value = record as Record<string, unknown>;
		return typeof value.playedAt === 'string' && Number.isFinite(Date.parse(value.playedAt))
			&& new Date(value.playedAt).toISOString() === value.playedAt
			&& Array.isArray(value.players) && value.players.length === 2
			&& value.players.every(isPlayer);
	})) throw new Error('Invalid battle history.');
	return data.slice(0, HISTORY_LIMIT);
}

export function prependBattle(history: readonly BattleRecord[], battle: BattleRecord): BattleRecord[] {
	return [battle, ...history].slice(0, HISTORY_LIMIT);
}

export function formatBattleSummary(battle: BattleRecord): string {
	const [first, second] = battle.players;
	const outcome = battleOutcome([first.totalContributions, second.totalContributions]);
	const count = (total: number) =>
		`${total.toLocaleString('en-US')} ${total === 1 ? 'contribution' : 'contributions'}`;
	return [
		'Mona Mayhem - GitHub Contribution Battle',
		`@${first.username}: ${count(first.totalContributions)}`,
		`@${second.username}: ${count(second.totalContributions)}`,
		outcome.winner === null
			? `Draw: ${count(first.totalContributions)} each.`
			: `Winner: @${battle.players[outcome.winner].username} (+${count(outcome.margin)}).`,
	].join('\n');
}
