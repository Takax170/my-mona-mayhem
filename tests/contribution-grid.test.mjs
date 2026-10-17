import assert from 'node:assert/strict';
import { test } from 'node:test';
import { contributionRows, isPlayerResult } from '../src/lib/contribution-grid.ts';

function fixture() {
	return {
		username: 'octocat',
		totalContributions: 2,
		from: '2025-12-31',
		to: '2026-01-05',
		weeks: [
			{
				firstDay: '2026-01-04',
				days: [{ date: '2026-01-05', count: 0, level: 0, color: '#ebedf0' }],
			},
			{
				firstDay: '2025-12-28',
				days: [{ date: '2025-12-31', count: 2, level: 2, color: '#40c463' }],
			},
		],
	};
}

test('grid aligns partial weeks by UTC weekday and orders weeks without changing the input', () => {
	const data = fixture();
	const original = structuredClone(data);
	assert.equal(isPlayerResult(data), true);
	const rows = contributionRows(data.weeks);
	assert.equal(rows.length, 7);
	assert.ok(rows.every((row) => row.length === 2));
	assert.equal(rows[3][0].date, '2025-12-31');
	assert.equal(rows[1][1].date, '2026-01-05');
	assert.equal(rows[1][1].count, 0);
	assert.equal(rows.flat().filter(Boolean).length, 2);
	assert.deepEqual(rows[0], [undefined, undefined]);
	assert.deepEqual(data, original);
});

test('grid accepts all five levels, including zero-contribution accounts', () => {
	const data = fixture();
	data.totalContributions = 0;
	data.from = '2026-01-04';
	data.to = '2026-01-08';
	data.weeks = [{
		firstDay: '2026-01-04',
		days: Array.from({ length: 5 }, (_, level) => ({
			date: `2026-01-0${4 + level}`, count: 0, level,
			color: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'][level],
		})),
	}];
	assert.equal(isPlayerResult(data), true);
	assert.equal(contributionRows(data.weeks).flat().filter(Boolean).length, 5);
});

test('grid rejects malformed days and weeks instead of rendering an empty success', () => {
	const changes = [
		(d) => { delete d.weeks; },
		(d) => { d.weeks = []; },
		(d) => { d.weeks[0].days = []; },
		(d) => { d.weeks[0].firstDay = '2026-01-05'; },
		(d) => { d.weeks[0].days[0].date = '2026-02-30'; },
		(d) => { d.weeks[0].days[0].date = '2026-01-12'; },
		(d) => { d.weeks[0].days[0].date = '2026-01-03'; },
		(d) => { d.weeks[0].days[0].color = 'red'; },
		(d) => { d.weeks[0].days[0].color = '#ebedf0\n'; },
		(d) => { d.weeks[0].days[0].count = -1; },
		(d) => { d.weeks[0].days[0].count = 0.5; },
		(d) => { d.weeks[0].days[0].level = 5; },
		(d) => { d.weeks[0].days.push(d.weeks[0].days[0]); },
		(d) => { d.weeks.push(d.weeks[0]); },
		(d) => { d.to = '2026-01-04'; },
	];
	for (const change of changes) {
		const data = fixture();
		change(data);
		assert.equal(isPlayerResult(data), false, change.toString());
	}
});
