import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load = (async ({ parent }) => {
	const { session } = await parent();

	if (session?.user) {
		throw redirect(302, `/${session.user.name}`);
	}
	return {};
}) satisfies PageServerLoad;
