import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isUserSearchQuery, searchGitHubUsers, UserSearchError } from '../src/lib/user-search.ts';
import { GET } from '../src/pages/api/users/[query].ts';

test('user search validates prefixes and never sends search qualifiers to GitHub', async () => {
	for (const query of ['', 'a', '-ab', 'ab--cd', 'octo\n', 'octo in:email', 'a'.repeat(40)]) {
		assert.equal(isUserSearchQuery(query), false);
		await assert.rejects(searchGitHubUsers(query, {
			fetcher: () => assert.fail('Invalid searches must not contact GitHub'),
		}), (error) => error instanceof UserSearchError && error.status === 400);
	}
	for (const query of ['oc', 'OctoCat', 'octo-', 'a'.repeat(39)]) {
		assert.equal(isUserSearchQuery(query), true);
	}
});

test('user search returns only validated logins from five real GitHub suggestions', async () => {
	const users = await searchGitHubUsers('octo', {
		fetcher: async (url, options) => {
			const parsed = new URL(url);
			assert.equal(parsed.origin, 'https://api.github.com');
			assert.equal(parsed.searchParams.get('q'), 'octo in:login type:user');
			assert.equal(parsed.searchParams.get('per_page'), '5');
			assert.ok(options.signal instanceof AbortSignal);
			return Response.json({ items: [{ login: 'octocat', email: 'not-returned' }, { login: 'octo-test' }] });
		},
	});
	assert.deepEqual(users, [{ login: 'octocat' }, { login: 'octo-test' }]);
	assert.deepEqual(await searchGitHubUsers('none', {
		fetcher: async () => Response.json({ items: [] }),
	}), []);
});

test('user search surfaces rate limits, upstream failures and malformed payloads', async () => {
	for (const status of [403, 429, 500]) {
		await assert.rejects(searchGitHubUsers('octo', {
			fetcher: async () => new Response(null, { status }),
		}), (error) => error instanceof UserSearchError && error.status === (status === 500 ? 502 : 429));
	}
	for (const payload of [{}, { items: [null] }, { items: [{ login: '<script>' }] }, { items: [{ login: 'octo\n' }] },
		{ items: [{ login: 'a'.repeat(40) }] }, { items: Array(6).fill({ login: 'octocat' }) }]) {
		await assert.rejects(searchGitHubUsers('octo', {
			fetcher: async () => Response.json(payload),
		}), (error) => error instanceof UserSearchError && error.status === 502);
	}
	await assert.rejects(searchGitHubUsers('octo', {
		fetcher: async () => { throw new TypeError('Network failure'); },
	}), /Check your connection/);
});

test('user search times out and preserves caller cancellation', async (t) => {
	const timeout = new AbortController();
	t.mock.method(AbortSignal, 'timeout', (milliseconds) => {
		assert.equal(milliseconds, 5000);
		return timeout.signal;
	});
	await assert.rejects(searchGitHubUsers('octo', {
		fetcher: async () => {
			timeout.abort();
			throw timeout.signal.reason;
		},
	}), (error) => error instanceof UserSearchError && error.status === 504);
	const caller = new AbortController();
	const reason = new DOMException('Cancelled', 'AbortError');
	caller.abort(reason);
	await assert.rejects(searchGitHubUsers('octo', {
		signal: caller.signal,
		fetcher: async (url, { signal }) => { throw signal.reason; },
	}), (error) => error === reason);
});

test('search route serializes successes and actionable errors with no-store headers', async (t) => {
	const request = new Request('http://localhost/api/users/octo');
	t.mock.method(globalThis, 'fetch', async () => Response.json({ items: [{ login: 'octocat' }] }));
	const response = await GET({ params: { query: 'octo' }, request });
	assert.equal(response.status, 200);
	assert.equal(response.headers.get('Cache-Control'), 'no-store');
	assert.deepEqual(await response.json(), { users: [{ login: 'octocat' }] });
	const invalid = await GET({ params: { query: '-invalid' }, request });
	assert.equal(invalid.status, 400);
	t.mock.method(globalThis, 'fetch', async () => new Response(null, { status: 429 }));
	const limited = await GET({ params: { query: 'octo' }, request });
	assert.equal(limited.status, 429);
	assert.match((await limited.json()).error.message, /limit reached/);
});
