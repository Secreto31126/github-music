import { error, redirect } from '@sveltejs/kit';
import { getRepoStructure, getSymlinkTarget } from '$lib/server/github';
import { getName, getParentPath, removeExtension } from '$lib/utils/paths';
import getFileUrl from '$lib/utils/getFileUrl';
import { normalize, join, extname } from 'path/posix';

import type { File, Song } from '$lib/types';
import type { PageServerLoad } from './$types';

class Folder {
	readonly '.': Folder;
	readonly '..': Folder;
	[path: string]: Folder | number;

	constructor(parent?: Folder) {
		this['.'] = this;
		this['..'] = parent ?? this;
	}
}

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

	const root = new Folder();
	for (const node of tree) {
		if (!node.path || !node.type) continue;

		const parts = node.path.split('/');

		let current = root;
		for (let i = 0; i < parts.length; i++) {
			const part = parts[i];

			// If last part and not a folder
			if (i === parts.length - 1 && node.type !== 'tree') {
				current[part] = parseInt(node.mode || '1');
			} else {
				if (!current[part]) {
					current[part] = new Folder(current);
				}

				current = current[part] as Folder;
			}
		}
	}

	const { found, dir, parent } = getDir(root, path);

	if (!found) {
		throw error(404, { message: 'Path not found' });
	}

	const is_path_to_file = !(dir instanceof Folder);
	const is_path_to_audio = is_path_to_file && isAudio(path);

	if (is_path_to_file && !is_path_to_audio) {
		throw error(415, { message: 'Unsupported file type' });
	}

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
	const cwd = dir ?? parent ?? root;

	// Here are stored the images' promises to later fill list.files[].cover_url
	const images = [] as (Promise<string | null> | null)[];

	for (const filename in cwd) {
		const file = cwd[filename];

		if (file instanceof Folder) {
			if (filename === '.' || filename === '..') continue;

			const cover_path = findCover(file, join(list.path, filename));
			images.push(cover_path ? getFileUrl(name, repo, branch, cover_path, fetch) : null);

			list.files.push({
				display_name: filename,
				filename,
				cover_url: null,
				type: 'folder'
			});
		} else if (isAudio(filename)) {
			let symlink = null as Song | null;

			if (file === 120000) {
				const target = await getSymlinkTarget(token, name, repo, join(list.path, filename), branch);

				// If for some reason the symlink target is not found or doesn't point to a valid audio, skip it
				if (!target || !isAudio(target)) continue;

				const path = normalize(join(list.path, target));

				const symlink_parent_path = getParentPath(path, 1);
				const { found, dir: symlink_dir } = getDir(root, symlink_parent_path);

				// If for some reason the symlink dir is not found, skip it
				if (!found || !symlink_dir) continue;

				const cover_path = findCover(symlink_dir, symlink_parent_path);

				images.push(
					cover_path ? getFileUrl(name, repo, branch, normalize(cover_path), fetch) : null
				);

				symlink = {
					path,
					cover_path: cover_path || null,
					display_name: removeExtension(filename)
				};
			}

			list.files.push({
				display_name: symlink?.display_name || removeExtension(filename),
				filename,
				cover_url: null,
				type: 'song'
			});

			if (songs) {
				if (filename === requested_song) {
					songs.index = songs.list.length;
				}

				songs.list.push({
					display_name: removeExtension(filename),
					path: symlink?.path || join(list.path, filename),
					cover_path: symlink?.cover_path || list.cover_path
				});
			}
		} else if (!list.cover_url && isImage(filename)) {
			list.cover_path = join(list.path, filename);
			list.cover_url = await getFileUrl(name, repo, branch, join(list.path, filename), fetch);
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

function findCover(dir: Folder, path: string): string | null {
	for (const subfile in dir) {
		if (isImage(subfile)) {
			return join(path, subfile);
		}
	}

	return null;
}

function isImage(filename: string) {
	const supported = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
	return supported.includes(extname(filename).toLowerCase());
}

function isAudio(filename: string) {
	/**
	 * @see https://en.wikipedia.org/wiki/HTML5_audio#Supported_audio_coding_formats
	 */
	const supported = ['.wav', '.mp3', '.mp4', '.adts', '.ogg', '.webm', '.flac'];
	return supported.includes(extname(filename).toLowerCase());
}

function getDir(
	start: Folder,
	path: string
): { found: boolean; dir: Folder | null; parent: Folder | null } {
	let dir = start as Folder | null;
	let parent = null as Folder | null;
	for (const filename of path.split('/')) {
		if (!filename || !dir) break;

		if (!Object.prototype.hasOwnProperty.call(dir, filename)) {
			return { found: false, dir, parent };
		}

		parent = dir;

		/**
		 * What a lovely thing, TypeScript
		 * @see https://github.com/microsoft/TypeScript/issues/10530
		 */
		const temp: Folder | number = dir[filename];

		dir = temp instanceof Folder ? temp : null;
	}

	// dir === null means the path is to a file
	return { found: true, dir, parent };
}
