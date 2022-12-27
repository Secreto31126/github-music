import { redirect, fail } from '@sveltejs/kit';
import { getRepoList } from '$lib/server/github';

import type { PageServerLoad, Actions } from './$types';

export const load = (async ({ cookies, setHeaders }) => {
	const token = cookies.get('access_token');

	if (!token) {
		throw redirect(302, '/login');
	}

	const repos = getRepoList(token);

	setHeaders({
		age: (await repos).headers.age?.toString() || '0',
		'cache-control': (await repos).headers['cache-control'] || 'no-cache'
	});

	return {
		repos: (await repos).data.map((repo) => repo.name)
	};
}) satisfies PageServerLoad;

export const actions: Actions = {
	repo: async ({ request, params }) => {
		const data = await request.formData();
		const repo = data.get('repo');
		const branch = data.get('branch') || 'main';

		if (!repo) {
			return fail(400, { message: 'No repo selected, are you trying to break my app?' });
		}

		throw redirect(302, `/${params.name}/${repo}?branch=${branch}`);
	}
};
