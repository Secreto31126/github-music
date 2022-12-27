import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load = (async ({ parent, setHeaders }) => {
	const { session } = await parent();
	if (session?.user) {
		setHeaders({
			age: session.expires,
			'cache-control': 'public'
		});
		throw redirect(302, `/${session.user.name}`);
	}
	return {};
}) satisfies PageServerLoad;
