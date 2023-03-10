import { error, redirect } from '@sveltejs/kit';
import { getRepoStructure, getSymlinkTarget } from '$lib/server/github';
import getFileUrl from '$lib/utils/getFileUrl';
import { normalize, join, extname, basename, dirname, parse, isAbsolute } from 'path/posix';

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

	const requested_song = is_path_to_audio ? basename(path) : null;

	const songs = is_path_to_audio
		? {
				list: [] as Song[],
				index: 0
		  }
		: null;

	const list = {
		root: parent === null,
		name: parent === null ? '/' : basename(is_path_to_audio ? dirname(path) : path),
		path: is_path_to_audio ? dirname(path) : path,
		cover_url: null as string | null,
		cover_path: null as string | null,
		files: [] as Array<File>
	};

	// If the path is to a song, use the parent folder
	const cwd = dir ?? parent ?? root;

	// Here are stored the images' promises to later fill list.files[].cover_url
	const images_promises = {} as Record<string, Promise<string | null>>;
	const images_paths = [] as (string | null)[];

	for (const filename in cwd) {
		const file = cwd[filename];
		const file_path = join(list.path, filename);

		if (file instanceof Folder) {
			if (filename === '.' || filename === '..') continue;

			const cover_path = findCover(file, file_path);

			images_paths.push(cover_path);
			if (cover_path) {
				// Thanks Fireship ;)
				images_promises[cover_path] ||= getFileUrl(name, repo, branch, cover_path, fetch);
			}

			list.files.push({
				display_name: filename,
				filename,
				cover_url: null,
				type: 'folder'
			});
		} else if (isAudio(filename)) {
			const display_name = parse(filename).name;

			let symlink = null as Song | null;

			if (file === 120000) {
				const target = await getSymlinkTarget(token, name, repo, file_path, branch);

				// If for some reason the symlink target is not found or doesn't point to a valid audio, skip it
				if (!target || !isAudio(target)) continue;

				const path = normalize(isAbsolute(target) ? target.slice(1) : join(list.path, target));

				const linked_parent_path = dirname(path);
				const { found, dir: linked_dir } = getDir(root, linked_parent_path);

				// If for some reason the symlink dir is not found, skip it
				if (!found || !linked_dir) continue;

				// If the symlink points to a folder or another link, skip it
				const linked = linked_dir[basename(path)];
				if (linked instanceof Folder || linked === 120000) continue;

				const cover_path = findCover(linked_dir, linked_parent_path);

				images_paths.push(cover_path);
				if (cover_path) {
					images_promises[cover_path] ||= getFileUrl(name, repo, branch, cover_path, fetch);
				}

				symlink = {
					path,
					cover_path: cover_path || null,
					display_name
				};
			}

			list.files.push({
				display_name,
				filename,
				cover_url: null,
				type: 'song'
			});

			if (songs) {
				if (filename === requested_song) {
					songs.index = songs.list.length;
				}

				songs.list.push({
					display_name,
					path: symlink?.path || file_path,
					cover_path: symlink?.cover_path || list.cover_path
				});
			}
		} else if (!list.cover_url && isImage(filename)) {
			list.cover_path = file_path;
			list.cover_url = await getFileUrl(name, repo, branch, file_path, fetch);
		}
	}

	await Promise.all(Object.values(images_promises));

	for (let i = 0; i < images_paths.length; i++) {
		const cover = images_paths[i];
		if (cover) {
			list.files[i].cover_url = await images_promises[cover];
		}
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
		if (!dir) break;
		if (!filename) continue;

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
