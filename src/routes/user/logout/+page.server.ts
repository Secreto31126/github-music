import type { PageServerLoad } from './$types';

import { redirect } from '@sveltejs/kit';

export const load = (async ({ cookies }) => {
	cookies.delete('username', { path: '/' });
	cookies.delete('avatar_url', { path: '/' });
	cookies.delete('access_token', { path: '/' });

	throw redirect(302, '/login');
}) satisfies PageServerLoad;
