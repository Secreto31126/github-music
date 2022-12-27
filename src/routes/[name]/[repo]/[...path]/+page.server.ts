import { redirect } from '@sveltejs/kit';
import { getRepoFile, getRepoStructure } from '$lib/server/github';
import type { PageServerLoad } from './$types';

export const load = (async ({ params, cookies, url }) => {
	const name = params.name;
	const repo = params.repo;
	const path = params.path;
	const branch = url.searchParams.get('branch') || 'main';

	const token = cookies.get('access_token');

	if (!token) {
		throw redirect(302, '/login');
	}

	const tree = (await getRepoStructure(token, name, repo, branch)).data.tree;

	type Node = {
		[path: string]: Node;
	};

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

	const list = {
		path,
		cover: null as string | null,
		files: [] as Array<{
			filename: string;
			cover: string | null;
		}>
	};

	let song = null as {
		cover: string | null;
		url: string | null;
		path: string;
	} | null;

	let dir = root;
	let parent = null as Node | null;
	for (const filename of path.split('/')) {
		if (!filename) break;
		parent = dir;
		dir = dir[filename];
	}

	// Parse the files in the directory
	if (Object.keys(dir).length) {
		for (const filename in dir) {
			if (Object.keys(dir[filename]).length || filename.endsWith('.mp3')) {
				let cover = null;
				for (const subfile in dir[filename]) {
					if (subfile.endsWith('.jpg') || subfile.endsWith('.png')) {
						try {
							const file = await getRepoFile(
								token,
								name,
								repo,
								`${list.path}/${filename}/${subfile}`
							);

							if (!Array.isArray(file.data)) {
								cover = file.data.download_url;
								break;
							}
						} catch (error) {
							console.error(error);
						}
					}
				}

				list.files.push({
					filename,
					cover
				});

				continue;
			}

			if (filename.endsWith('.jpg') || filename.endsWith('.png')) {
				try {
					const file = await getRepoFile(token, name, repo, `${list.path}/${filename}`);
					if (!Array.isArray(file.data)) {
						list.cover = file.data.download_url;
					}
				} catch (error) {
					console.error(error);
				}

				continue;
			}
		}

		for (const file of list.files) if (!file.cover) file.cover = list.cover;
	}

	// No kids and finishs with .mp3, probably a song
	else if (path.endsWith('.mp3')) {
		let cover = null as string | null;
		for (const filename in parent) {
			if (filename.endsWith('.jpg') || filename.endsWith('.png')) {
				try {
					const file = await getRepoFile(
						token,
						name,
						repo,
						`${list.path.split('/').slice(0, -1).join('/')}/${filename}`
					);

					if (!Array.isArray(file.data)) {
						cover = file.data.download_url;
					}
				} catch (error) {
					console.error(error);
				}

				break;
			}
		}

		let url = null as string | null;
		try {
			const file = await getRepoFile(token, name, repo, path);

			if (!Array.isArray(file.data)) {
				url = file.data.download_url;
			}
		} catch (error) {
			console.error(error);
		}

		song = {
			cover,
			path,
			url
		};
	}

	return {
		list,
		song
	};
}) satisfies PageServerLoad;
