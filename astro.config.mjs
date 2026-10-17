// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

const githubPages = process.env.PUBLIC_GITHUB_PAGES === 'true';
const [owner, repository] = (process.env.GITHUB_REPOSITORY ?? 'Takax170/my-mona-mayhem').split('/');

// https://astro.build/config
export default defineConfig({
	output: githubPages ? 'static' : 'server',
	site: githubPages ? `https://${owner}.github.io` : undefined,
	base: githubPages && repository !== `${owner}.github.io` ? `/${repository}` : '/',
	adapter: githubPages ? undefined : node({
		mode: 'standalone'
	}),
	integrations: githubPages ? [{
		name: 'github-pages-static-routes',
		hooks: {
			'astro:route:setup': ({ route }) => {
				if (route.component === 'src/pages/api/contributions/[username].ts') {
					route.prerender = true;
				}
			},
		},
	}] : [],
});
