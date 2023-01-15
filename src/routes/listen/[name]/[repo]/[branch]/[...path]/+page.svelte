<script lang="ts">
	import type { PageData } from './$types';
	import type { Song as SongType } from '$lib/types';
	import type { Page } from '@sveltejs/kit';

	import Player from '$lib/components/Player.svelte';
	import Album from '$lib/components/Album.svelte';
	import Song from '$lib/components/Song.svelte';

	import { navigating, page } from '$app/stores';
	import { get } from 'svelte/store';
	import { fade, fly } from 'svelte/transition';
	import { invalidateAll } from '$app/navigation';
	import { getParentPath } from '$lib/utils/paths';

	export let data: PageData;

	let index = 0;
	let origin: Page<Record<string, string>, string | null>;
	$: update = !!data.songs;
	let songs = null as Array<SongType> | null;

	async function setSongs(song_data: PageData['songs']) {
		if (!song_data) return;

		index = song_data.index;
		origin = get(page);

		// Trigger reactivity at the end
		const temp = [] as Array<SongType>;
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

	$: if ($navigating && $navigating.from?.url.href === $navigating.to?.url.href) {
		invalidateAll();
	}
</script>

<svelte:head>
	<title>
		{songs?.[index]?.display_name ?? !list.root ? list.name : 'GitHub Music'}
	</title>
</svelte:head>

<main class="px-4 pb-10">
	<div class="mb-4">
		{#if !list.root}
			<a href={getParentPath($page.url.pathname, data.songs ? 2 : 1)} class="text-contrast">
				Seeing playlist: {list.name}
			</a>
		{:else}
			<p class="text-contrast">Seeing playlist: /</p>
		{/if}
	</div>

	<div
		class="grid justify-items-center grid-cols-1 min-[320px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 px-2"
	>
		{#each list.files as file}
			{@const href = `${data.songs ? getParentPath($page.url.pathname, 1) : $page.url.pathname}/${
				file.filename
			}`}
			{#if file.type === 'folder'}
				<Album {file} {href} />
			{/if}
		{/each}
	</div>

	<div class="flex flex-col gap-4 px-2 pb-16 w-fit min-w-[33%]">
		{#each list.files as file}
			{@const href = `${data.songs ? getParentPath($page.url.pathname, 1) : $page.url.pathname}/${
				file.filename
			}`}
			{#if file.type === 'song'}
				<Song {file} {href} />
			{/if}
		{/each}
	</div>
</main>

{#if songs}
	<footer class="fixed bottom-0 left-0 flex w-full h-20 text-center" transition:fly={{ y: 200 }}>
		<div class="w-full h-full" transition:fade>
			<Player bind:songs bind:index {origin} />
		</div>
	</footer>
{/if}
