import type { APIRoute } from 'astro';
import { searchGitHubUsers, UserSearchError } from '../../../lib/user-search.ts';

export const prerender = false;

export function getStaticPaths() {
	return [];
}

export const GET: APIRoute = async ({ params, request }) => {
	const headers = { 'Cache-Control': 'no-store' };
	try {
		const users = await searchGitHubUsers(params.query ?? '', { signal: request.signal });
		return Response.json({ users }, { headers });
	} catch (error) {
		if (error instanceof UserSearchError) {
			return Response.json({ error: { message: error.message } }, { status: error.status, headers });
		}
		console.error('Unexpected GitHub user search error.', {
			name: error instanceof Error ? error.name : typeof error,
		});
		return Response.json({ error: { message: 'Unable to search GitHub.' } }, { status: 500, headers });
	}
};
