export interface UserSuggestion {
	login: string;
}

export class UserSearchError extends Error {
	readonly status: number;

	constructor(status: number, message: string) {
		super(message);
		this.name = 'UserSearchError';
		this.status = status;
	}
}

export function isUserSearchQuery(query: string): boolean {
	return query.match(/^[a-z\d][a-z\d-]{1,38}$/i)?.[0] === query && !query.includes('--');
}

export function isUserSuggestions(value: unknown): value is UserSuggestion[] {
	return Array.isArray(value) && value.length <= 5 && value.every((item: unknown) =>
		typeof item === 'object' && item !== null && 'login' in item
		&& typeof item.login === 'string' && item.login.match(/^[a-z\d]+(?:-[a-z\d]+)*$/i)?.[0] === item.login
		&& item.login.length <= 39);
}

export async function searchGitHubUsers(
	query: string,
	{ signal, fetcher = fetch }: { signal?: AbortSignal; fetcher?: typeof fetch } = {},
): Promise<UserSuggestion[]> {
	if (!isUserSearchQuery(query)) {
		throw new UserSearchError(400, 'Enter 2-39 letters, digits or single hyphens to search.');
	}
	const timeout = AbortSignal.timeout(5000);
	try {
		const url = new URL('https://api.github.com/search/users');
		url.search = new URLSearchParams({ q: `${query} in:login type:user`, per_page: '5' }).toString();
		const response = await fetcher(url.toString(), {
			headers: { Accept: 'application/vnd.github+json' },
			signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
		});
		if (response.status === 403 || response.status === 429) {
			throw new UserSearchError(429, 'GitHub search limit reached. Try again later or enter the full username.');
		}
		if (!response.ok) {
			throw new UserSearchError(502, 'GitHub search is unavailable. You can still enter the full username.');
		}
		const data: unknown = await response.json();
		if (typeof data !== 'object' || data === null || !('items' in data)
			|| !isUserSuggestions(data.items)) {
			throw new UserSearchError(502, 'GitHub returned unreadable suggestions. Enter the full username instead.');
		}
		return data.items.map(({ login }) => ({ login }));
	} catch (error) {
		if (signal?.aborted) throw error;
		if (timeout.aborted) {
			throw new UserSearchError(504, 'GitHub search timed out. Try again or enter the full username.');
		}
		if (error instanceof UserSearchError) throw error;
		throw new UserSearchError(502, 'Unable to search GitHub. Check your connection or enter the full username.');
	}
}
