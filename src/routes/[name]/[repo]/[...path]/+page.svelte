<script lang="ts">
	import type { PageData } from './$types';

	import Player from '$lib/Player.svelte';

	import { navigating, page } from '$app/stores';
	import { get } from 'svelte/store';
	import { fade, fly } from 'svelte/transition';
	import { invalidateAll } from '$app/navigation';
	import { getName, getParentPath } from '$lib/paths';

	export let data: PageData;

	let retries = 0;
	let song: {
		name: string;
		path: string;
		url: string | null;
		cover: string | null;
	} | null = null;

	async function getUrl() {
		try {
			const request = await fetch(get(page).url.pathname);
			return await request.text();
		} catch (error) {
			console.error(error);
			return null;
		}
	}

	async function setSong(song_data: PageData['song']) {
		if (!song_data) return;

		song = {
			url: await getUrl(),
			name: song_data.path.split('/').pop() || 'Error',
			path: song_data.path,
			cover: song_data.cover
		};
	}

	$: if (data.song && data.song.update) {
		data.song.update = false;
		setSong(data.song);
		retries = 0;
	}

	let list: {
		root: boolean;
		name: string;
		path: string;
		cover: string | null;
		files: Array<{
			filename: string;
			cover: string | null;
		}>;
	};

	$: if (data.list.path !== list?.path) {
		list = {
			root: data.list.root,
			name: data.list.root ? '/' : getName(data.list.path, 1) || '/',
			path: data.list.path,
			cover: data.list.cover,
			files: data.list.files
		};
	}

	function missingImg(event: Event) {
		const target = event.target as HTMLImageElement;
		target.src = '/favicon.png';
	}

	async function missingAudio() {
		if (!song) {
			retries = 0;
			return;
		}

		if (retries < 3) {
			retries++;
			song.url = await getUrl();
		} else {
			song.url = null;
			retries = 0;
		}
	}

	$: if ($navigating && $navigating.from?.url.href === $navigating.to?.url.href) {
		invalidateAll();
	}
</script>

<svelte:head>
	<title>{song ? song.name : list?.name !== '/' ? list.name : 'GitHub Music'}</title>
</svelte:head>

<main class="flex flex-col gap-4 mx-2 mb-16">
	{#if !list.root}
		<a href="{getParentPath($page.url.pathname, data.song ? 2 : 1)}{$page.url.search}">
			Seeing playlist: {list.name}
		</a>
	{:else}
		<p>Seeing playlist: /</p>
	{/if}

	{#each list.files as file}
		<a
			href="{data.song ? getParentPath($page.url.pathname, 1) : $page.url.pathname}
				/{file.filename}{$page.url.search}"
			class="flex items-center space-x-2 h-16 w-fit"
		>
			<img
				src={file.cover || '/favicon.png'}
				alt="Cover"
				on:error={missingImg}
				class="aspect-square h-full"
			/>
			<p>{file.filename}</p>
		</a>
	{/each}

	{#if song}
		<span class="mb-2" />
	{/if}
</main>

{#if song}
	<footer class="fixed bottom-0 left-0 flex w-full h-16 text-center" transition:fly={{ y: 200 }}>
		<div class="w-full h-full" transition:fade>
			<Player
				bind:song
				on:error={missingAudio}
				origin="{getParentPath(get(page).url.pathname, 1)}{get(page).url.search}"
			/>
		</div>
	</footer>
{/if}
