import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ContributionError, createContributionService } from '../src/lib/contributions.ts';
import { GET } from '../src/pages/api/contributions/[username].ts';

function fixture() {
	return {
		schema: 'v2',
		from: '2025-12-31',
		to: '2026-01-05',
		total_contributions: 10,
		private_contributions_included: false,
		colors_full: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
		weeks: [
			{
				first_day: '2026-01-04',
				contribution_days: [
					{ weekday: 1, count: 2, level: 2 },
					{ weekday: 0, count: 1, level: 1 },
				],
			},
			{
				first_day: '2025-12-28',
				contribution_days: [
					{ weekday: 6, count: 4, level: 4 },
					{ weekday: 3, count: 3, level: 3 },
				],
			},
		],
	};
}

const jsonResponse = (data = fixture()) => Response.json(data);
const rejectsWith = (promise, code, status) => assert.rejects(promise, (error) => {
	assert.ok(error instanceof ContributionError);
	assert.equal(error.code, code);
	assert.equal(error.status, status);
	return true;
});

test('normalizes v2 dates in UTC, partial weeks, colors and chronological order', async () => {
	const service = createContributionService({
		fetcher: async (url, options) => {
			assert.equal(url, 'https://github.com/octocat.contribs');
			assert.deepEqual(options.headers, { Accept: 'application/json' });
			assert.ok(options.signal instanceof AbortSignal);
			return jsonResponse();
		},
	});
	assert.deepEqual(await service('OctoCat'), {
		username: 'octocat',
		totalContributions: 10,
		from: '2025-12-31',
		to: '2026-01-05',
		privateContributionsIncluded: false,
		weeks: [
			{
				firstDay: '2025-12-28',
				days: [
					{ date: '2025-12-31', count: 3, level: 3, color: '#30a14e' },
					{ date: '2026-01-03', count: 4, level: 4, color: '#216e39' },
				],
			},
			{
				firstDay: '2026-01-04',
				days: [
					{ date: '2026-01-04', count: 1, level: 1, color: '#9be9a8' },
					{ date: '2026-01-05', count: 2, level: 2, color: '#40c463' },
				],
			},
		],
	});
});

test('accepts a real zero-contribution payload without treating it as a missing user', async () => {
	const data = fixture();
	data.total_contributions = 0;
	for (const week of data.weeks) {
		for (const day of week.contribution_days) {
			day.count = 0;
			day.level = 0;
		}
	}
	const service = createContributionService({ fetcher: async () => jsonResponse(data) });
	const result = await service('zero');
	assert.equal(result.totalContributions, 0);
	assert.ok(result.weeks.every((week) => week.days.every((day) => day.color === '#ebedf0')));
});

test('validates usernames before fetching and accepts boundary lengths', async () => {
	let calls = 0;
	const service = createContributionService({
		fetcher: async () => { calls++; return jsonResponse(); },
	});
	for (const username of [
		undefined, '', '-abc', 'abc-', 'a--b', 'a_b', 'a/b', 'a?b', 'a#b',
		' a', 'a ', 'a\n', 'a\r', 'a\u2028', 'é', 'a'.repeat(40),
	]) {
		await rejectsWith(service(username), 'INVALID_USERNAME', 400);
	}
	assert.equal(calls, 0);
	for (const username of ['a', 'a'.repeat(39), 'a-b', '123']) {
		assert.equal((await service(username)).username, username);
	}
	assert.equal(calls, 4);
});

test('rejects invalid upstream JSON fields rather than synthesizing defaults', async (t) => {
	const changes = {
		'schema version': (d) => { d.schema = 'v3'; },
		'private flag': (d) => { delete d.private_contributions_included; },
		'calendar date': (d) => { d.from = '2025-02-30'; },
		'reversed range': (d) => { d.from = '2026-02-01'; },
		'total count': (d) => { d.total_contributions = -1; },
		'palette': (d) => { d.colors_full[2] = 'not-a-color'; },
		'missing palette level': (d) => { d.colors_full.pop(); },
		'weeks': (d) => { d.weeks = []; },
		'duplicate weeks': (d) => { d.weeks.push(d.weeks[0]); },
		'non-Sunday first day': (d) => { d.weeks[0].first_day = '2026-01-05'; },
		'empty week': (d) => { d.weeks[0].contribution_days = []; },
		'duplicate day': (d) => { d.weeks[0].contribution_days.push(d.weeks[0].contribution_days[0]); },
		'invalid weekday': (d) => { d.weeks[0].contribution_days[0].weekday = 7; },
		'fractional count': (d) => { d.weeks[0].contribution_days[0].count = 0.5; },
		'invalid level': (d) => { d.weeks[0].contribution_days[0].level = 5; },
		'day outside range': (d) => { d.to = '2026-01-04'; },
	};
	for (const [name, change] of Object.entries(changes)) {
		await t.test(name, async () => {
			const data = fixture();
			change(data);
			const service = createContributionService({ fetcher: async () => jsonResponse(data) });
			await rejectsWith(service('octocat'), 'INVALID_UPSTREAM_RESPONSE', 502);
		});
	}
	for (const data of [null, [], { schema: 'v2' }]) {
		const service = createContributionService({ fetcher: async () => jsonResponse(data) });
		await rejectsWith(service('octocat'), 'INVALID_UPSTREAM_RESPONSE', 502);
	}
});

test('maps upstream statuses and forwards only valid Retry-After values', async (t) => {
	const cases = [
		[404, {}, 'USER_NOT_FOUND', 404],
		[429, { 'Retry-After': '60' }, 'UPSTREAM_RATE_LIMITED', 503, '60'],
		[429, { 'Retry-After': 'Sun, 18 Oct 2026 07:00:00 GMT' },
			'UPSTREAM_RATE_LIMITED', 503, 'Sun, 18 Oct 2026 07:00:00 GMT'],
		[429, { 'Retry-After': 'tomorrow' }, 'UPSTREAM_RATE_LIMITED', 503],
		[403, { 'X-RateLimit-Remaining': '0' }, 'UPSTREAM_RATE_LIMITED', 503],
		[403, { 'Retry-After': '30' }, 'UPSTREAM_RATE_LIMITED', 503, '30'],
		[403, {}, 'UPSTREAM_ERROR', 502],
		[500, {}, 'UPSTREAM_ERROR', 502],
	];
	for (const [status, headers, code, expectedStatus, retryAfter] of cases) {
		await t.test(`${status} ${JSON.stringify(headers)}`, async () => {
			const service = createContributionService({
				fetcher: async () => new Response('upstream detail', { status, headers }),
			});
			await assert.rejects(service('octocat'), (error) => {
				assert.equal(error.code, code);
				assert.equal(error.status, expectedStatus);
				assert.equal(error.retryAfter, retryAfter);
				assert.ok(!error.message.includes('upstream detail'));
				return true;
			});
		});
	}
});

test('distinguishes malformed JSON, wrong content type, network and body failures', async () => {
	const cases = [
		[async () => new Response('{', { headers: { 'Content-Type': 'application/json' } }),
			'INVALID_UPSTREAM_RESPONSE'],
		[async () => new Response('<html>'), 'INVALID_UPSTREAM_RESPONSE'],
		[async () => { throw new TypeError('network failure'); }, 'UPSTREAM_ERROR'],
		[async () => ({
			ok: true, status: 200, headers: new Headers({ 'Content-Type': 'application/json' }),
			json: async () => { throw new TypeError('body disconnected'); },
		}), 'UPSTREAM_ERROR'],
	];
	for (const [fetcher, code] of cases) {
		await rejectsWith(createContributionService({ fetcher })('octocat'), code, 502);
	}
});

test('enforces the 10-second timeout for both fetch and body reading', async (t) => {
	for (const phase of ['fetch', 'body']) {
		await t.test(phase, async (t) => {
			const controller = new AbortController();
			t.mock.method(AbortSignal, 'timeout', (milliseconds) => {
				assert.equal(milliseconds, 10_000);
				return controller.signal;
			});
			const waitForAbort = (signal) => new Promise((resolve, reject) => {
				signal.addEventListener('abort', () => reject(signal.reason), { once: true });
				queueMicrotask(() => controller.abort(new DOMException('Timeout', 'TimeoutError')));
			});
			const service = createContributionService({
				fetcher: async (url, { signal }) => {
					if (phase === 'fetch') return waitForAbort(signal);
					return {
						ok: true, status: 200,
						headers: new Headers({ 'Content-Type': 'application/json' }),
						json: () => waitForAbort(signal),
					};
				},
			});
			await rejectsWith(service('octocat'), 'UPSTREAM_TIMEOUT', 504);
		});
	}
});

test('cache shares case-insensitive keys and expires exactly five minutes after success', async () => {
	let time = 0;
	let calls = 0;
	const service = createContributionService({
		now: () => time,
		fetcher: async () => { calls++; time += 100; return jsonResponse(); },
	});
	await service('Octocat');
	time = 300_099;
	await service('OCTOCAT');
	assert.equal(calls, 1);
	time = 300_100;
	await service('octocat');
	assert.equal(calls, 2);
});

test('cache bounds results to 500 users and evicts the oldest insertion', async () => {
	const calls = [];
	const service = createContributionService({
		now: () => 0,
		fetcher: async (url) => { calls.push(url); return jsonResponse(); },
	});
	for (let i = 0; i <= 500; i++) await service(`user-${i}`);
	await service('user-1');
	assert.equal(calls.length, 501);
	await service('user-0');
	assert.equal(calls.length, 502);
	assert.equal(calls.at(-1), 'https://github.com/user-0.contribs');
});

test('cache purges expired entries before evicting a still-valid user', async () => {
	let time = 0;
	let calls = 0;
	const service = createContributionService({
		now: () => time,
		fetcher: async () => { calls++; return jsonResponse(); },
	});
	await service('old');
	time = 100;
	await service('valid');
	for (let i = 0; i < 498; i++) await service(`user-${i}`);
	time = 300_000;
	await service('new');
	await service('valid');
	assert.equal(calls, 501);
});

test('cache deduplicates concurrent requests and removes failed in-flight entries', async () => {
	let calls = 0;
	let release;
	let fail = true;
	const service = createContributionService({
		fetcher: async () => {
			calls++;
			await new Promise((resolve) => { release = resolve; });
			if (fail) throw new TypeError('disconnected');
			return jsonResponse();
		},
	});
	const requests = [service('Octocat'), service('OCTOCAT')];
	assert.equal(calls, 1);
	const failures = requests.map((request) => rejectsWith(request, 'UPSTREAM_ERROR', 502));
	release();
	await Promise.all(failures);
	fail = false;
	const retry = service('octocat');
	assert.equal(calls, 2);
	release();
	await retry;
	await service('Octocat');
	assert.equal(calls, 2);
});

test('cache never serves stale data or remembers HTTP and validation errors', async () => {
	let time = 0;
	let calls = 0;
	const responses = [
		() => jsonResponse(),
		() => new Response(null, { status: 404 }),
		() => jsonResponse({}),
		() => jsonResponse(),
	];
	const service = createContributionService({
		now: () => time,
		fetcher: async () => responses[calls++](),
	});
	await service('octocat');
	time = 300_000;
	await rejectsWith(service('octocat'), 'USER_NOT_FOUND', 404);
	await rejectsWith(service('octocat'), 'INVALID_UPSTREAM_RESPONSE', 502);
	await service('octocat');
	assert.equal(calls, 4);
});

test('route serializes success and error contracts with no-store headers', async (t) => {
	const cases = [
		['route-success', () => jsonResponse(), 200],
		['-invalid', () => { assert.fail('invalid username must not fetch'); }, 400, 'INVALID_USERNAME'],
		['route-missing', () => new Response(null, { status: 404 }), 404, 'USER_NOT_FOUND'],
		['route-limit', () => new Response(null, { status: 429, headers: { 'Retry-After': '60' } }),
			503, 'UPSTREAM_RATE_LIMITED'],
		['route-failure', () => new Response(null, { status: 500 }), 502, 'UPSTREAM_ERROR'],
		['route-malformed', () => jsonResponse({}), 502, 'INVALID_UPSTREAM_RESPONSE'],
	];
	for (const [username, upstream, status, code] of cases) {
		await t.test(username, async (t) => {
			t.mock.method(globalThis, 'fetch', upstream);
			const response = await GET({ params: { username } });
			assert.equal(response.status, status);
			assert.equal(response.headers.get('Content-Type'), 'application/json');
			assert.equal(response.headers.get('Cache-Control'), 'no-store');
			assert.equal(response.headers.get('Access-Control-Allow-Origin'), null);
			const body = await response.json();
			if (code) {
				assert.deepEqual(Object.keys(body), ['error']);
				assert.equal(body.error.code, code);
				assert.equal(typeof body.error.message, 'string');
			} else {
				assert.equal(body.username, username);
				assert.equal(body.totalContributions, 10);
			}
			assert.equal(response.headers.get('Retry-After'), username === 'route-limit' ? '60' : null);
		});
	}
});

test('route returns 504 on timeout and logs unexpected failures without exposing details', async (t) => {
	const controller = new AbortController();
	t.mock.method(AbortSignal, 'timeout', () => controller.signal);
	t.mock.method(globalThis, 'fetch', async () => {
		controller.abort();
		throw controller.signal.reason;
	});
	const timeout = await GET({ params: { username: 'route-timeout' } });
	assert.equal(timeout.status, 504);
	assert.equal((await timeout.json()).error.code, 'UPSTREAM_TIMEOUT');
	t.mock.restoreAll();
	const logged = t.mock.method(console, 'error', () => {});
	t.mock.method(globalThis, 'fetch', async () => { throw new Error('private internal detail'); });
	const response = await GET({ params: { username: 'route-unexpected' } });
	assert.equal(response.status, 500);
	assert.equal(response.headers.get('Cache-Control'), 'no-store');
	assert.deepEqual(await response.json(), {
		error: { code: 'INTERNAL_ERROR', message: 'Unable to load contributions.' },
	});
	assert.equal(logged.mock.calls.length, 1);
	assert.ok(!JSON.stringify(logged.mock.calls[0].arguments).includes('private internal detail'));
});
