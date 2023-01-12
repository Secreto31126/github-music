import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load = (async ({ parent }) => {
	const { session } = await parent();

	if (!session?.user?.name) {
		throw redirect(302, '/login?error=Unexpected%20missing%20username');
	}

	throw redirect(302, `/listen/${session.user.name}`);
}) satisfies PageServerLoad;
