import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ cookies }) => {
	const token = cookies.get('access_token');
	const username = cookies.get('username');

	if (token && username) {
		throw redirect(302, `/listen/${username}`);
	}

	return {};
}) satisfies PageServerLoad;
