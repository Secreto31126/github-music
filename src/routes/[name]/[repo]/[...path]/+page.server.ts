import { error, redirect } from '@sveltejs/kit';
import { getRepoStructure } from '$lib/server/github';
import { getName, getParentPath } from '$lib/paths';
import getFileUrl from '$lib/getFileUrl';

import type { Song } from '$lib/types';
import type { PageServerLoad } from './$types';

type Node = {
	[path: string]: Node;
};

export const load = (async ({ params, cookies, url, setHeaders, fetch }) => {
	const name = params.name;
	const repo = params.repo;
	const path = params.path;
	const branch = url.searchParams.get('branch') || 'main';

	const token = cookies.get('access_token');

	if (!token) {
		throw redirect(302, '/login?error=Timed%20out');
	}

	setHeaders({
		age: ((new Date().getMinutes() % 2) * 60 + new Date().getSeconds()).toString(),
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

	const is_path_to_audio = !Object.keys(dir).length && isAudio(path);
	const requested_song = is_path_to_audio ? getName(path, 1) : null;

	const songs = is_path_to_audio
		? {
				list: [] as Song[],
				index: 0
		  }
		: null;

	const list = {
		root: parent === null,
		name: parent === null ? '/' : getName(path, is_path_to_audio ? 2 : 1) || '/',
		path: is_path_to_audio ? getParentPath(path, 1) : path,
		cover: null as string | null,
		cover_name: null as string | null,
		files: [] as Array<{
			filename: string;
			cover: string | null;
			type: 'folder' | 'song';
		}>
	};

	// If the path is to a song, use the parent folder
	const listed_dir = is_path_to_audio ? parent || root : dir;

	for (const filename in listed_dir) {
		// If folder
		if (Object.keys(listed_dir[filename]).length) {
			const cover_path = findCover(listed_dir[filename], `${list.path}/${filename}`);
			const cover = cover_path ? await getFileUrl(`/${name}/${repo}/${cover_path}`, fetch) : null;

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

			if (songs) {
				if (filename === requested_song) {
					songs.index = songs.list.length;
				}

				songs.list.push({
					name: filename,
					path: `${list.path}/${filename}`,
					cover: list.cover_name
				});
			}
		} else if (isImage(filename) && !list.cover) {
			list.cover_name = filename;
			list.cover = await getFileUrl(`/${name}/${repo}/${list.path}/${filename}`, fetch);
		}
	}

	// Fill missing covers
	for (const file of list.files) {
		if (!file.cover) {
			file.cover = list.cover;
		}
	}

	if (songs && list.cover_name) {
		for (const song of songs.list) {
			song.cover = list.cover_name;
		}
	}

	return {
		list,
		songs
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
	return (
		filename.endsWith('.jpg') ||
		filename.endsWith('.jpeg') ||
		filename.endsWith('.png') ||
		filename.endsWith('.gif') ||
		filename.endsWith('.webp')
	);
}

function isAudio(filename: string) {
	return filename.endsWith('.mp3') || filename.endsWith('.ogg') || filename.endsWith('.wav');
}
