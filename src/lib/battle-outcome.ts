export interface BattleOutcome {
	winner: 0 | 1 | null;
	margin: number;
}

export function battleOutcome(totals: readonly [number, number]): BattleOutcome {
	const [first, second] = totals;
	if (first === second) return { winner: null, margin: 0 };
	return first > second
		? { winner: 0, margin: first - second }
		: { winner: 1, margin: second - first };
}
