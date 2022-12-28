import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load = (async ({ parent }) => {
	const { session } = await parent();

	if (!session?.user) {
		throw redirect(302, '/login');
	}
	return {};
}) satisfies PageServerLoad;
