import type { LayoutServerLoad } from './$types';

export const load = (async ({ cookies }) => {
	const username = cookies.get('username');
	const avatar_url = cookies.get('avatar_url');
	const access_token = cookies.get('access_token');

	if (username && avatar_url && access_token) {
		return { username, avatar_url };
	}

	return {};
}) satisfies LayoutServerLoad;
