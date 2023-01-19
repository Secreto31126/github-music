import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load = (async ({ cookies }) => {
	const username = cookies.get('username');
	const avatar_url = cookies.get('avatar_url');

	if (!username) {
		throw redirect(302, '/login?error=Timed%20out');
	}

	return { username, avatar_url };
}) satisfies LayoutServerLoad;
