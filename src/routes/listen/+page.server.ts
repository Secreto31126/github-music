import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load = (async ({ cookies }) => {
	const username = cookies.get('username');

	if (!username) {
		throw redirect(302, '/login?error=Unexpected%20missing%20username');
	}

	throw redirect(302, `/listen/${username}`);
}) satisfies PageServerLoad;
