export interface ContributionDay {
	date: string;
	count: number;
	level: 0 | 1 | 2 | 3 | 4;
	color: string;
}

export interface ContributionWeek {
	firstDay: string;
	days: ContributionDay[];
}

export interface Contributions {
	username: string;
	totalContributions: number;
	from: string;
	to: string;
	privateContributionsIncluded: boolean;
	weeks: ContributionWeek[];
}

type ErrorCode =
	| 'INVALID_USERNAME'
	| 'USER_NOT_FOUND'
	| 'UPSTREAM_RATE_LIMITED'
	| 'UPSTREAM_TIMEOUT'
	| 'UPSTREAM_ERROR'
	| 'INVALID_UPSTREAM_RESPONSE';

export class ContributionError extends Error {
	readonly code: ErrorCode;
	readonly status: number;
	readonly retryAfter: string | undefined;

	constructor(code: ErrorCode, status: number, message: string, retryAfter?: string) {
		super(message);
		this.name = 'ContributionError';
		this.code = code;
		this.status = status;
		this.retryAfter = retryAfter;
	}
}

function invalidResponse(): never {
	throw new ContributionError(
		'INVALID_UPSTREAM_RESPONSE', 502, 'GitHub returned invalid contribution data.',
	);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function record(value: unknown): Record<string, unknown> {
	if (!isRecord(value)) {
		invalidResponse();
	}
	return value;
}

function dateString(value: unknown): string {
	if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
		invalidResponse();
	}
	const timestamp = Date.parse(`${value}T00:00:00.000Z`);
	if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== value) {
		invalidResponse();
	}
	return value;
}

function count(value: unknown): number {
	if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
		invalidResponse();
	}
	return value;
}

function contributionLevel(value: unknown): ContributionDay['level'] {
	if (value !== 0 && value !== 1 && value !== 2 && value !== 3 && value !== 4) {
		invalidResponse();
	}
	return value;
}

function normalizeContributions(value: unknown, username: string): Contributions {
	const data = record(value);
	if (data.schema !== 'v2' || typeof data.private_contributions_included !== 'boolean') {
		invalidResponse();
	}
	const from = dateString(data.from);
	const to = dateString(data.to);
	const totalContributions = count(data.total_contributions);
	if (from > to || !Array.isArray(data.colors_full) || data.colors_full.length !== 5) {
		invalidResponse();
	}
	const colors = data.colors_full.map((color: unknown) => {
		if (typeof color !== 'string' || color.length !== 7 || !/^#[0-9a-f]{6}$/i.test(color)) {
			invalidResponse();
		}
		return color;
	});
	if (!Array.isArray(data.weeks) || data.weeks.length === 0) {
		invalidResponse();
	}
	const seenWeeks = new Set<string>();
	const seenDays = new Set<string>();
	const weeks = data.weeks.map((value: unknown): ContributionWeek => {
		const week = record(value);
		const firstDay = dateString(week.first_day);
		const timestamp = Date.parse(`${firstDay}T00:00:00.000Z`);
		if (new Date(timestamp).getUTCDay() !== 0 || seenWeeks.has(firstDay)) {
			invalidResponse();
		}
		seenWeeks.add(firstDay);
		if (!Array.isArray(week.contribution_days)
			|| week.contribution_days.length === 0 || week.contribution_days.length > 7) {
			invalidResponse();
		}
		const days = week.contribution_days.map((value: unknown): ContributionDay => {
			const day = record(value);
			const weekday = count(day.weekday);
			const level = contributionLevel(day.level);
			const color = colors[level];
			if (weekday > 6 || color === undefined) {
				invalidResponse();
			}
			const date = new Date(timestamp + weekday * 86_400_000).toISOString().slice(0, 10);
			if (date < from || date > to || seenDays.has(date)) {
				invalidResponse();
			}
			seenDays.add(date);
			return {
				date,
				count: count(day.count),
				level,
				color,
			};
		});
		days.sort((a, b) => a.date.localeCompare(b.date));
		return { firstDay, days };
	});
	weeks.sort((a, b) => a.firstDay.localeCompare(b.firstDay));
	return {
		username, totalContributions, from, to,
		privateContributionsIncluded: data.private_contributions_included,
		weeks,
	};
}

function normalizeUsername(value: string | undefined): string {
	if (!value || value.length > 39
		|| value.match(/^[a-z\d]+(?:-[a-z\d]+)*$/i)?.[0] !== value) {
		throw new ContributionError(
			'INVALID_USERNAME', 400,
			'A GitHub username must contain 1-39 letters, digits or single hyphens, with no leading or trailing hyphen.',
		);
	}
	return value.toLowerCase();
}

function retryAfterHeader(value: string | null): string | undefined {
	if (value !== null && (/^\d+$/.test(value)
		|| (Number.isFinite(Date.parse(value)) && new Date(value).toUTCString() === value))) {
		return value;
	}
	return undefined;
}

async function fetchContributions(
	username: string, fetcher: typeof fetch,
): Promise<Contributions> {
	const signal = AbortSignal.timeout(10_000);
	try {
		const response = await fetcher(`https://github.com/${username}.contribs`, {
			headers: { Accept: 'application/json' },
			signal,
		});
		const retryAfter = retryAfterHeader(response.headers.get('Retry-After'));
		if (response.status === 404) {
			throw new ContributionError('USER_NOT_FOUND', 404, 'GitHub user not found.');
		}
		if (response.status === 429 || (response.status === 403
			&& (response.headers.get('X-RateLimit-Remaining') === '0' || retryAfter !== undefined))) {
			throw new ContributionError(
				'UPSTREAM_RATE_LIMITED', 503, 'GitHub is rate limiting requests. Try again later.',
				retryAfter,
			);
		}
		if (!response.ok) {
			throw new ContributionError('UPSTREAM_ERROR', 502, 'GitHub could not return contribution data.');
		}
		if (!/^application\/json(?:;|$)/i.test(response.headers.get('Content-Type') ?? '')) {
			invalidResponse();
		}
		const value: unknown = await response.json();
		signal.throwIfAborted();
		return normalizeContributions(value, username);
	} catch (error) {
		if (signal.aborted) {
			throw new ContributionError('UPSTREAM_TIMEOUT', 504, 'GitHub did not respond within 10 seconds.');
		}
		if (error instanceof ContributionError) {
			throw error;
		}
		if (error instanceof SyntaxError) {
			invalidResponse();
		}
		if (error instanceof TypeError || (error instanceof Error && error.name === 'AbortError')) {
			throw new ContributionError('UPSTREAM_ERROR', 502, 'Unable to read contribution data from GitHub.');
		}
		throw error;
	}
}

interface ServiceOptions {
	fetcher?: typeof fetch;
	now?: () => number;
}

export function createContributionService({
	fetcher = (...args) => fetch(...args),
	now = Date.now,
}: ServiceOptions = {}) {
	const cache = new Map<string, { data: Contributions; expiresAt: number }>();
	const pending = new Map<string, Promise<Contributions>>();

	return async (input: string | undefined): Promise<Contributions> => {
		const username = normalizeUsername(input);
		const cached = cache.get(username);
		if (cached && cached.expiresAt > now()) {
			return cached.data;
		}
		cache.delete(username);
		const existing = pending.get(username);
		if (existing) {
			return existing;
		}
		const request = (async () => {
			try {
				const data = await fetchContributions(username, fetcher);
				const timestamp = now();
				for (const [key, entry] of cache) {
					if (entry.expiresAt <= timestamp) {
						cache.delete(key);
					}
				}
				if (cache.size >= 500) {
					const oldest = cache.keys().next();
					if (!oldest.done) {
						cache.delete(oldest.value);
					}
				}
				cache.set(username, { data, expiresAt: timestamp + 300_000 });
				return data;
			} finally {
				pending.delete(username);
			}
		})();
		pending.set(username, request);
		return request;
	};
}

export const getContributions = createContributionService();
