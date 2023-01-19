import { redirect } from '@sveltejs/kit';
import { getRepoList, getRepoListOf } from '$lib/server/github';

import type { PageServerLoad } from './$types';

export const load = (async ({ cookies, params, parent, setHeaders }) => {
	const { username } = await parent();

	const token = cookies.get('access_token');

	if (!token) {
		throw redirect(302, '/login?error=Timed%20out');
	}

	const name = params.name;

	const repos = name === username ? getRepoList(token) : getRepoListOf(token, name);

	setHeaders({
		age: (await repos).headers.age?.toString() || '0',
		'cache-control': (await repos).headers['cache-control'] || 'no-cache'
	});

	return {
		repos: (await repos).data.map((repo) => ({ name: repo.name, branch: repo.default_branch }))
	};
}) satisfies PageServerLoad;
