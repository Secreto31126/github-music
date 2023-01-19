import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load = (async ({ cookies }) => {
	const username = cookies.get('username');
	const avatar_url = cookies.get('avatar_url');

	if (!username) {
		throw redirect(302, '/login');
	}

	return { username, avatar_url };
}) satisfies PageServerLoad;
