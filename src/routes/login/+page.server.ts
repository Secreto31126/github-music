import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load = (async ({ parent, url }) => {
	const { session } = await parent();

	if (session?.user) {
		throw redirect(302, `/${session.user.name}${url.search}`);
	}
	return {};
}) satisfies PageServerLoad;
