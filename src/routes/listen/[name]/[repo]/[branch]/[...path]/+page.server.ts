import { error, redirect } from '@sveltejs/kit';
import { getRepoStructure } from '$lib/server/github';
import { getName, getParentPath, removeExtension } from '$lib/utils/paths';
import getFileUrl from '$lib/utils/getFileUrl';

import type { File, Song } from '$lib/types';
import type { PageServerLoad } from './$types';

type Node = {
	[path: string]: Node;
};

export const load = (async ({ params, cookies, setHeaders, fetch }) => {
	const name = params.name;
	const repo = params.repo;
	const path = params.path;
	const branch = params.branch;

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
		cover_url: null as string | null,
		cover_path: null as string | null,
		files: [] as Array<File>
	};

	// If the path is to a song, use the parent folder
	const listed_dir = is_path_to_audio ? parent || root : dir;

	// Here are stored the images' promises to later fill list.files[].cover_url
	const images = [] as (Promise<string | null> | null)[];

	for (const filename in listed_dir) {
		// If folder
		if (Object.keys(listed_dir[filename]).length) {
			const cover_path = findCover(listed_dir[filename], `${list.path}/${filename}`);
			images.push(cover_path ? getFileUrl(name, repo, branch, cover_path, fetch) : null);

			list.files.push({
				display_name: filename,
				filename,
				cover_url: null,
				type: 'folder'
			});
		} else if (isAudio(filename)) {
			list.files.push({
				display_name: removeExtension(filename),
				filename,
				cover_url: list.cover_url,
				type: 'song'
			});

			if (songs) {
				if (filename === requested_song) {
					songs.index = songs.list.length;
				}

				songs.list.push({
					display_name: removeExtension(filename),
					path: `${list.path}/${filename}`,
					cover_path: list.cover_path
				});
			}
		} else if (!list.cover_url && isImage(filename)) {
			list.cover_path = `${list.path}/${filename}`;
			list.cover_url = await getFileUrl(name, repo, branch, `${list.path}/${filename}`, fetch);
		}
	}

	let i = 0;
	for (const cover of await Promise.all(images)) {
		list.files[i++].cover_url = cover;
	}

	// Fill missing covers
	for (const file of list.files) {
		if (!file.cover_url) {
			file.cover_url = list.cover_url;
		}
	}

	if (songs && list.cover_path) {
		for (const song of songs.list) {
			if (!song.cover_path) {
				song.cover_path = list.cover_path;
			}
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
	const supported = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
	return supported.includes(filename.toLowerCase().split('.').at(-1) ?? '');
}

function isAudio(filename: string) {
	/**
	 * @see https://en.wikipedia.org/wiki/HTML5_audio#Supported_audio_coding_formats
	 */
	const supported = ['wav', 'mp3', 'mp4', 'adts', 'ogg', 'webm', 'flac'];
	return supported.includes(filename.toLowerCase().split('.').at(-1) ?? '');
}
