import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load = (async ({ params }) => {
	throw redirect(302, `/listen/${params.name}/${params.repo}/main`);
}) satisfies PageServerLoad;
