import type { Session } from '@auth/core/types';
import type { LayoutServerLoad } from './$types';

type UserData = Session & {
	access_token?: string;
};

export const load = (async ({ locals, cookies }) => {
	const session: UserData | null = await locals.getSession();

	if (session?.access_token) {
		cookies.set('access_token', session.access_token, {
			maxAge: parseInt(session.expires),
			path: '/'
		});
	}

	delete session?.access_token;

	return { session };
}) satisfies LayoutServerLoad;
