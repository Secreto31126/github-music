import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load = (async ({ parent, url }) => {
	const { username } = await parent();

	if (username) {
		throw redirect(302, `/listen/${username}${url.search}`);
	}
	return {};
}) satisfies LayoutServerLoad;

export const prerender = true;
