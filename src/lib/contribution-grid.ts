import type { ContributionDay, Contributions, ContributionWeek } from './contributions.ts';

export type PlayerResult = Pick<
	Contributions, 'username' | 'totalContributions' | 'from' | 'to' | 'weeks'
>;

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isDate(value: unknown): value is string {
	if (typeof value !== 'string' || value.length !== 10
		|| !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
	const timestamp = Date.parse(`${value}T00:00:00Z`);
	return Number.isFinite(timestamp)
		&& new Date(timestamp).toISOString().slice(0, 10) === value;
}

export function isPlayerResult(value: unknown): value is PlayerResult {
	if (!isRecord(value)
		|| typeof value.username !== 'string' || value.username.length === 0
		|| typeof value.totalContributions !== 'number'
		|| !Number.isSafeInteger(value.totalContributions) || value.totalContributions < 0
		|| !isDate(value.from) || !isDate(value.to) || value.from > value.to
		|| !Array.isArray(value.weeks) || value.weeks.length === 0) return false;

	const from = value.from;
	const to = value.to;
	const seenWeeks = new Set<string>();
	const seenDays = new Set<string>();
	return value.weeks.every((week: unknown) => {
		if (!isRecord(week) || !isDate(week.firstDay)
			|| !Array.isArray(week.days) || week.days.length === 0 || week.days.length > 7
			|| seenWeeks.has(week.firstDay)) return false;
		const start = Date.parse(`${week.firstDay}T00:00:00Z`);
		if (new Date(start).getUTCDay() !== 0) return false;
		seenWeeks.add(week.firstDay);
		return week.days.every((day: unknown) => {
			if (!isRecord(day) || !isDate(day.date) || day.date < from || day.date > to
				|| seenDays.has(day.date)
				|| typeof day.count !== 'number' || !Number.isSafeInteger(day.count) || day.count < 0
				|| (day.level !== 0 && day.level !== 1 && day.level !== 2
					&& day.level !== 3 && day.level !== 4)
				|| typeof day.color !== 'string' || day.color.length !== 7
				|| !/^#[0-9a-f]{6}$/i.test(day.color)) return false;
			const timestamp = Date.parse(`${day.date}T00:00:00Z`);
			if (timestamp < start || timestamp >= start + 7 * 86_400_000) return false;
			seenDays.add(day.date);
			return true;
		});
	});
}

export function contributionRows(
	weeks: ContributionWeek[],
): (ContributionDay | undefined)[][] {
	const ordered = [...weeks].sort((a, b) => a.firstDay.localeCompare(b.firstDay));
	return Array.from({ length: 7 }, (_, weekday) =>
		ordered.map((week) => week.days.find((day) =>
			new Date(`${day.date}T00:00:00Z`).getUTCDay() === weekday)));
}
