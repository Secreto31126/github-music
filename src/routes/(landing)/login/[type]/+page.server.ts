import type { PageServerLoad } from './$types';
import { GITHUB_ID } from '$env/static/private';

import { redirect } from '@sveltejs/kit';

export const load = (async ({ params }) => {
	const url = new URL('https://github.com/login/oauth/authorize');

	url.searchParams.set('client_id', GITHUB_ID);
	url.searchParams.set('scope', params.type === 'private' ? 'read:user,repo' : 'read:user');

	throw redirect(302, url.toString());
}) satisfies PageServerLoad;
