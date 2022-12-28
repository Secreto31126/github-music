import { error, redirect } from '@sveltejs/kit';
import { getRepoStructure } from '$lib/server/github';
import type { PageServerLoad } from './$types';
import { getParentPath } from '$lib/paths';

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
		'cache-control': 'private, max-age=300, s-maxage=300'
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
		path: string;
		cover: string | null;
		update: boolean;
	} | null;

	// If it's not a folder and has an audio file extension
	if (!Object.keys(dir).length && isAudio(path)) {
		const cover = findCover(parent || ({} as Node), path.split('/').slice(0, -1).join('/'));

		song = {
			path,
			cover,
			update: true
		};
	}

	const list = {
		root: parent === null,
		path: song ? getParentPath(path, 1) : path,
		cover: null as string | null,
		files: [] as Array<{
			filename: string;
			cover: string | null;
			type: 'folder' | 'song';
		}>
	};

	// If the path is a song, use the parent folder
	const listed_dir = song ? parent || root : dir;

	for (const filename in listed_dir) {
		// If folder
		if (Object.keys(listed_dir[filename]).length) {
			const cover = findCover(listed_dir[filename], `${list.path}/${filename}`);

			list.files.push({
				filename,
				cover,
				type: 'folder'
			});
		} else if (isAudio(filename)) {
			list.files.push({
				filename,
				cover: list.cover,
				type: 'song'
			});
		} else if (isImage(filename) && !list.cover) {
			list.cover = `${list.path}/${filename}`;
		}
	}

	// Fill missing covers
	for (const file of list.files) if (!file.cover) file.cover = list.cover;

	return {
		list,
		song
	};
}) satisfies PageServerLoad;

function findCover(dir: Node, path: string): string | null {
	for (const subfile in dir) {
		if (isImage(subfile)) {
			return `${path}/${subfile}`;
		}
	}

	return null;
}

function isImage(filename: string) {
	return filename.endsWith('.jpg') || filename.endsWith('.png');
}

function isAudio(filename: string) {
	return filename.endsWith('.mp3');
}
