import type { RequestHandler } from './$types';
import { error, redirect } from '@sveltejs/kit';
import { getRepoFile } from '$lib/server/github';

export const GET = (async ({ cookies, params, setHeaders }) => {
	const name = params.name;
	const repo = params.repo;
	const path = params.path;

	const token = cookies.get('access_token');

	if (!token) {
		throw redirect(302, '/login');
	}

	let request;
	try {
		request = await getRepoFile(token, name, repo, path);
	} catch (e) {
		throw error(404, { message: 'File not found' });
	}

	if (Array.isArray(request.data)) {
		throw error(400, { message: 'Not a file' });
	}

	if (!request.data.download_url) {
		throw error(413, { message: 'No download URL, file is too big' });
	}

	setHeaders({
		age: ((new Date().getMinutes() % 2) * 60 + new Date().getSeconds()).toString(),
		'cache-control': 'private, max-age=120, s-maxage=120'
	});

	return new Response(request.data.download_url);
}) satisfies RequestHandler;
