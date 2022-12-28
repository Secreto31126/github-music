import { error, redirect } from '@sveltejs/kit';
import { getRepoFile, getRepoStructure } from '$lib/server/github';
import type { PageServerLoad } from './$types';

type Node = {
	[path: string]: Node;
};

export const load = (async ({ params, cookies, url, setHeaders }) => {
	const name = params.name;
	const repo = params.repo;
	const path = params.path;
	const branch = url.searchParams.get('branch') || 'main';

	const token = cookies.get('access_token');

	if (!token) {
		throw redirect(302, '/login');
	}

	setHeaders({
		age: '0',
		'cache-control': 'private, max-age=120, s-maxage=120'
	});

	let tree;
	try {
		tree = (await getRepoStructure(token, name, repo, branch)).data.tree;
	} catch (e) {
		throw error(404, { message: 'Repo not found' });
	}

	const root = {} as Node;
	for (const node of tree) {
		if (!node.path || !node.type) continue;

		const parts = node.path.split('/');

		let current = root;
		for (const part of parts) {
			if (!current[part]) {
				current[part] = {} as Node;
			}
			current = current[part] as Node;
		}
	}

	let dir: Node | undefined = root;
	let parent = null as Node | null;
	for (const filename of path.split('/')) {
		if (!filename || !dir) break;
		parent = dir;
		dir = dir[filename];
	}

	if (!dir) {
		throw error(404, { message: 'Path not found' });
	}

	let song = null as {
		cover: string | null;
		url: string | null;
		path: string;
	} | null;

	// If it's not a folder and has an audio file extension
	if (!Object.keys(dir).length && isAudio(path)) {
		const cover = await findCover(
			token,
			name,
			repo,
			parent || ({} as Node),
			path.split('/').slice(0, -1).join('/')
		);

		let url = null as string | null;
		try {
			url = await getDownloadUrl(token, name, repo, path);
		} catch (error) {
			console.error(error);
		}

		song = {
			cover,
			path,
			url
		};
	}

	const list = {
		root: parent === null,
		path: song ? path.split('/').slice(0, -1).join('/') : path,
		cover: null as string | null,
		files: [] as Array<{
			filename: string;
			cover: string | null;
		}>
	};

	// If the path is a song, use the parent folder
	const listed_dir = song ? parent || root : dir;

	for (const filename in listed_dir) {
		// If folder
		if (Object.keys(listed_dir[filename]).length) {
			const cover = await findCover(
				token,
				name,
				repo,
				listed_dir[filename],
				`${list.path}/${filename}`
			);

			list.files.push({
				filename,
				cover
			});
		} else if (isAudio(filename)) {
			list.files.push({
				filename,
				cover: list.cover
			});
		} else if (isImage(filename) && !list.cover) {
			try {
				list.cover = await getDownloadUrl(token, name, repo, `${list.path}/${filename}`);
			} catch (error) {
				console.error(error);
			}
		}
	}

	// Fill missing covers
	for (const file of list.files) if (!file.cover) file.cover = list.cover;

	return {
		list,
		song
	};
}) satisfies PageServerLoad;

async function findCover(token: string, name: string, repo: string, dir: Node, path: string) {
	for (const subfile in dir) {
		if (isImage(subfile)) {
			try {
				return getDownloadUrl(token, name, repo, `${path}/${subfile}`);
			} catch (error) {
				console.error(error);
			}
		}
	}

	return null;
}

async function getDownloadUrl(token: string, name: string, repo: string, path: string) {
	const file = await getRepoFile(token, name, repo, path);

	if (!Array.isArray(file.data)) {
		return file.data.download_url;
	}

	return null;
}

function isImage(filename: string) {
	return filename.endsWith('.jpg') || filename.endsWith('.png');
}

function isAudio(filename: string) {
	return filename.endsWith('.mp3');
}
