import assert from 'node:assert/strict';
import test from 'node:test';
import { battleOutcome } from '../src/lib/battle-outcome.ts';
import { defaultSettings, parseSettings } from '../src/lib/xmb-settings.ts';
import { formatBattleSummary, HISTORY_LIMIT, parseHistory, prependBattle } from '../src/lib/battle-history.ts';

test('battleOutcome picks the higher total and reports draws', () => {
	assert.deepEqual(battleOutcome([120, 45]), { winner: 0, margin: 75 });
	assert.deepEqual(battleOutcome([0, 3]), { winner: 1, margin: 3 });
	assert.deepEqual(battleOutcome([0, 0]), { winner: null, margin: 0 });
});

test('parseSettings keeps valid fields and falls back for invalid data', () => {
	assert.deepEqual(parseSettings(null), defaultSettings);
	assert.deepEqual(parseSettings('{oops'), defaultSettings);
	assert.deepEqual(parseSettings('[1]'), defaultSettings);
	assert.deepEqual(parseSettings('{"sound":false,"volume":2,"boot":"no"}'),
		{ ...defaultSettings, sound: false, volume: 1, boot: true });
	assert.deepEqual(parseSettings('{"volume":-1}').volume, 0);
});

test('theme colors survive saved settings and older settings keep the blue default', () => {
	assert.equal(parseSettings('{"themeColor":"#C33E48","boot":false}').themeColor, '#c33e48');
	assert.equal(parseSettings('{"sound":false}').themeColor, defaultSettings.themeColor);
	for (const themeColor of ['red', '#fff', '#12345g', '#123456\n', 'url(example)', '', null, 123]) {
		assert.equal(parseSettings(JSON.stringify({ themeColor })).themeColor, defaultSettings.themeColor);
	}
});

const battle = {
	playedAt: '2026-10-17T08:00:00.000Z',
	players: [
		{ username: 'alpha', totalContributions: 900 },
		{ username: 'beta', totalContributions: 1200 },
	],
};

test('battle history round-trips valid summaries and rejects corrupt stored data', () => {
	assert.deepEqual(parseHistory(null), []);
	assert.deepEqual(parseHistory(JSON.stringify([battle])), [battle]);
	for (const data of ['{broken', '{}', '[null]', JSON.stringify([{ ...battle, playedAt: 'not-a-date' }]),
		JSON.stringify([{ ...battle, players: [battle.players[0]] }]),
		JSON.stringify([{ ...battle, players: [{ username: '<script>', totalContributions: 1 }, battle.players[1]] }]),
		JSON.stringify([{ ...battle, players: [{ username: 'valid', totalContributions: -1 }, battle.players[1]] }])]) {
		assert.throws(() => parseHistory(data));
	}
});

test('new battles appear first and history keeps only the latest 20 completed results', () => {
	const old = Array.from({ length: HISTORY_LIMIT }, (_, index) => ({
		...battle, playedAt: `2026-10-16T08:00:${String(index).padStart(2, '0')}.000Z`,
	}));
	const next = prependBattle(old, battle);
	assert.equal(next.length, HISTORY_LIMIT);
	assert.equal(next[0], battle);
	assert.equal(next.at(-1), old.at(-2));
	assert.equal(old.length, HISTORY_LIMIT);
	assert.equal(parseHistory(JSON.stringify([...old, battle])).length, HISTORY_LIMIT);
});

test('share summaries include both players, formatted totals, winners and draws', () => {
	assert.equal(formatBattleSummary(battle), [
		'Mona Mayhem - GitHub Contribution Battle',
		'@alpha: 900 contributions',
		'@beta: 1,200 contributions',
		'Winner: @beta (+300 contributions).',
	].join('\n'));
	assert.match(formatBattleSummary({ ...battle, players: [battle.players[1], battle.players[0]] }),
		/Winner: @beta/);
	assert.match(formatBattleSummary({ ...battle, players: [battle.players[0], battle.players[0]] }),
		/Draw: 900 contributions each\./);
	assert.match(formatBattleSummary({ ...battle, players: [
		{ username: 'alpha', totalContributions: 1 }, { username: 'beta', totalContributions: 0 },
	] }), /Winner: @alpha \(\+1 contribution\)\./);
});
