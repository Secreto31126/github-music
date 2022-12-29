<script lang="ts">
	import type { PageData } from './$types';
	import type { Song } from '$lib/types';

	import Player from '$lib/Player.svelte';

	import { navigating, page } from '$app/stores';
	import { get } from 'svelte/store';
	import { fade, fly } from 'svelte/transition';
	import { invalidateAll } from '$app/navigation';
	import { getParentPath } from '$lib/paths';

	export let data: PageData;

	let index = 0;
	let origin: URL;
	$: update = !!data.songs;
	let songs = null as Array<Song> | null;

	async function setSongs(song_data: PageData['songs']) {
		if (!song_data) return;

		index = song_data.index;
		origin = get(page).url;

		// Trigger reactivity at the end
		const temp = [] as Array<Song>;
		for (const song of song_data.list) {
			temp.push({ ...song });
		}

		songs = temp;
	}

	$: if (data.songs && update) {
		update = false;
		setSongs(data.songs);
	}

	let list: PageData['list'];
	$: if (data.list.path !== list?.path) {
		list = { ...data.list, files: [...data.list.files] };
	}

	function missingImg(event: Event) {
		const target = event.target as HTMLImageElement;
		target.src = '/favicon.png';
	}

	$: if ($navigating && $navigating.from?.url.href === $navigating.to?.url.href) {
		invalidateAll();
	}
</script>

<svelte:head>
	<title>
		{songs?.[index] ? songs[index].name : list.name !== '/' ? list.name : 'GitHub Music'}
	</title>
</svelte:head>

<main class="flex flex-col gap-4 mx-2 mb-16">
	{#if !list.root}
		<a href="{getParentPath($page.url.pathname, data.songs ? 2 : 1)}{$page.url.search}">
			Seeing playlist: {list.name}
		</a>
	{:else}
		<p>Seeing playlist: /</p>
	{/if}

	{#each list.files as file}
		<a
			href="{data.songs ? getParentPath($page.url.pathname, 1) : $page.url.pathname}
				/{file.filename}{$page.url.search}"
			data-sveltekit-noscroll={file.type === 'folder' ? 'off' : ''}
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

	{#if songs}
		<span class="mb-2" />
	{/if}
</main>

{#if songs}
	<footer class="fixed bottom-0 left-0 flex w-full h-16 text-center" transition:fly={{ y: 200 }}>
		<div class="w-full h-full" transition:fade>
			<Player bind:songs bind:index {origin} />
		</div>
	</footer>
{/if}
