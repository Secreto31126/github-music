import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load = (async ({ parent }) => {
	const { username } = await parent();

	if (!username) {
		throw redirect(302, '/login?error=Timed%20out');
	}

	return {};
}) satisfies LayoutServerLoad;
