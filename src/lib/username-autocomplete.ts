import { isUserSearchQuery, isUserSuggestions, searchGitHubUsers } from './user-search';
import type { UserSuggestion } from './user-search';

const cache = new Map<string, { users: UserSuggestion[]; expires: number }>();

async function loadSuggestions(query: string, signal: AbortSignal): Promise<UserSuggestion[]> {
	const cached = cache.get(query.toLowerCase());
	if (cached && cached.expires > Date.now()) return cached.users;
	let users: UserSuggestion[];
	if (import.meta.env.PUBLIC_GITHUB_PAGES === 'true') {
		users = await searchGitHubUsers(query, { signal });
	} else {
		const response = await fetch(`/api/users/${encodeURIComponent(query)}`, {
			signal: AbortSignal.any([signal, AbortSignal.timeout(6000)]),
		});
		const data: unknown = await response.json();
		if (!response.ok) {
			const message = typeof data === 'object' && data !== null && 'error' in data
				&& typeof data.error === 'object' && data.error !== null && 'message' in data.error
				&& typeof data.error.message === 'string' ? data.error.message : 'Unable to search GitHub.';
			throw new Error(message);
		}
		if (typeof data !== 'object' || data === null || !('users' in data) || !isUserSuggestions(data.users)) {
			throw new Error('GitHub returned unreadable suggestions. Enter the full username instead.');
		}
		users = data.users;
	}
	if (cache.size >= 100) cache.delete(cache.keys().next().value!);
	cache.set(query.toLowerCase(), { users, expires: Date.now() + 60_000 });
	return users;
}

export function setupUsernameAutocomplete(input: HTMLInputElement): () => void {
	const list = document.getElementById(`${input.id}-suggestions`);
	const menu = document.getElementById(`${input.id}-menu`);
	const status = document.getElementById(`${input.id}-search-status`);
	if (!list || !menu || !status) throw new Error('Username autocomplete is missing required elements.');
	let timer: ReturnType<typeof setTimeout> | undefined;
	let controller: AbortController | undefined;
	let version = 0;
	let users: UserSuggestion[] = [];
	let active = -1;

	const close = () => {
		clearTimeout(timer);
		controller?.abort();
		version++;
		list.hidden = true;
		menu.hidden = true;
		list.replaceChildren();
		status.textContent = '';
		input.setAttribute('aria-expanded', 'false');
		input.removeAttribute('aria-activedescendant');
		users = [];
		active = -1;
	};
	const choose = (index: number) => {
		const user = users[index];
		if (!user) return;
		input.value = user.login;
		close();
		input.dispatchEvent(new Event('change', { bubbles: true }));
	};
	const highlight = (index: number) => {
		active = index;
		[...list.children].forEach((option, optionIndex) =>
			option.setAttribute('aria-selected', String(optionIndex === active)));
		const option = list.children[active];
		if (option) {
			input.setAttribute('aria-activedescendant', option.id);
			option.scrollIntoView({ block: 'nearest' });
		}
	};
	const schedule = () => {
		close();
		const query = input.value.trim();
		if (!isUserSearchQuery(query)) return;
		const current = version;
		menu.hidden = false;
		status.textContent = 'Searching GitHub...';
		timer = setTimeout(async () => {
			controller = new AbortController();
			const signal = controller.signal;
			try {
				const result = await loadSuggestions(query, signal);
				if (current !== version || signal.aborted || document.activeElement !== input) return;
				users = result;
				status.textContent = users.length
					? `${users.length} suggestions. Use Up and Down, then Enter to select.`
					: 'No matching accounts. You can still enter a full username.';
				users.forEach((user, index) => {
					const option = document.createElement('li');
					option.id = `${input.id}-suggestion-${index}`;
					option.setAttribute('role', 'option');
					option.setAttribute('aria-selected', 'false');
					option.dataset.index = String(index);
					option.textContent = user.login;
					list.append(option);
				});
				list.hidden = users.length === 0;
				input.setAttribute('aria-expanded', String(users.length > 0));
			} catch (error) {
				if (current !== version || signal.aborted) return;
				status.textContent = error instanceof Error && error.name !== 'TypeError'
					? error.message : 'Unable to search GitHub. Check your connection or enter the full username.';
			}
		}, 500);
	};
	input.addEventListener('input', (event) => {
		if (!(event instanceof InputEvent) || !event.isComposing) schedule();
	});
	input.addEventListener('compositionstart', close);
	input.addEventListener('compositionend', schedule);
	input.addEventListener('focus', schedule);
	input.addEventListener('blur', close);
	input.addEventListener('keydown', (event) => {
		if (event.isComposing) return;
		if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && users.length) {
			event.preventDefault();
			highlight(event.key === 'ArrowDown' ? (active + 1) % users.length
				: (active <= 0 ? users.length : active) - 1);
		} else if (event.key === 'Enter' && active >= 0) {
			event.preventDefault();
			choose(active);
		} else if (event.key === 'Escape' && !menu.hidden) {
			event.preventDefault();
			close();
		} else if (event.key === 'Tab') {
			close();
		}
	});
	list.addEventListener('pointerdown', (event) => event.preventDefault());
	list.addEventListener('click', (event) => {
		const option = event.target instanceof Element ? event.target.closest('[role="option"]') : null;
		if (option instanceof HTMLElement) choose(Number(option.dataset.index));
	});
	return close;
}
