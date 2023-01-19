import type { PageServerLoad } from './$types';

import { redirect } from '@sveltejs/kit';
import { getUser } from '$lib/server/github';

import { GITHUB_ID, GITHUB_SECRET } from '$env/static/private';

export const load = (async ({ url, fetch, cookies }) => {
	const code = url.searchParams.get('code');

	if (!code) {
		throw redirect(302, '/login');
	}

	const token_url = new URL('https://github.com/login/oauth/access_token');
	token_url.searchParams.set('client_id', GITHUB_ID);
	token_url.searchParams.set('client_secret', GITHUB_SECRET);
	token_url.searchParams.set('code', code);

	const response = await fetch(token_url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/json'
		}
	});

	const { access_token } = await response.json();

	cookies.set('access_token', access_token, {
		path: '/'
	});

	const { login: username, avatar_url } = (await getUser(access_token)).data;

	cookies.set('username', username, {
		path: '/'
	});

	cookies.set('avatar_url', avatar_url, {
		path: '/'
	});

	throw redirect(302, `/listen/${username}`);
}) satisfies PageServerLoad;
