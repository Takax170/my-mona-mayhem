import type { APIRoute } from 'astro';
import { ContributionError, getContributions } from '../../../lib/contributions.ts';

export const prerender = false;

// Pages fetches GitHub directly, so no static username endpoints are generated.
export function getStaticPaths() {
	return [];
}

export const GET: APIRoute = async ({ params }) => {
	const headers = new Headers({
		'Content-Type': 'application/json',
		'Cache-Control': 'no-store',
	});
	try {
		return new Response(JSON.stringify(await getContributions(params.username)), { headers });
	} catch (error) {
		if (error instanceof ContributionError) {
			if (error.retryAfter !== undefined) {
				headers.set('Retry-After', error.retryAfter);
			}
			return new Response(JSON.stringify({
				error: { code: error.code, message: error.message },
			}), { status: error.status, headers });
		}
		console.error('Unexpected contribution proxy error.', {
			name: error instanceof Error ? error.name : typeof error,
		});
		return new Response(JSON.stringify({
			error: { code: 'INTERNAL_ERROR', message: 'Unable to load contributions.' },
		}), { status: 500, headers });
	}
};
