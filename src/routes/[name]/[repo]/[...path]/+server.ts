import type { RequestHandler } from './$types';
import { error, redirect } from '@sveltejs/kit';
import { getRepoFile } from '$lib/server/github';

export const GET = (async ({ cookies, params }) => {
	const name = params.name;
	const repo = params.repo;
	const path = params.path;

	const token = cookies.get('access_token');

	if (!token) {
		throw redirect(302, '/login');
	}

	let file;
	try {
		file = await getRepoFile(token, name, repo, path);
	} catch (e) {
		throw error(404, { message: 'File not found' });
	}

	if (Array.isArray(file.data)) {
		throw error(400, { message: 'Not a file' });
	}

	if (!file.data.download_url) {
		throw error(413, { message: 'No download URL, file is too big' });
	}

	return new Response(file.data.download_url);
}) satisfies RequestHandler;
