import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load = (async ({ parent, cookies }) => {
	const { session } = await parent();

	if (!session?.user?.name || !cookies.get('access_token')) {
		throw redirect(302, '/login');
	}

	return {};
}) satisfies LayoutServerLoad;
