import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load = (async ({ parent, url }) => {
	const { session } = await parent();

	if (session?.user?.name) {
		throw redirect(302, `/listen/${session.user.name}${url.search}`);
	}
	return {};
}) satisfies LayoutServerLoad;

export const prerender = true;
