<script lang="ts">
	import type { PageData } from './$types';
	import { page } from '$app/stores';

	export let data: PageData;

	let song: {
		name: string;
		path: string;
		url: string | null;
		cover: string | null;
	} | null = null;

	$: if (data.song && data.song.path !== song?.path) {
		song = {
			name: data.song.path.split('/').pop() || 'Error',
			path: data.song.path,
			url: data.song.url,
			cover: data.song.cover
		};
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
			name: data.list.root ? '/' : data.list.path.split('/').at(-1) || '/',
			path: data.list.path,
			cover: data.list.cover,
			files: data.list.files
		};
	}
</script>

<svelte:head>
	<title>{song ? song.name : list ? list.name : 'GitHub Music'}</title>
</svelte:head>

<div class="flex flex-col gap-2 mx-2">
	{#key song}
		{#if song}
			<p>Now Playing: {song.name}</p>
			{#if song.url}
				<a href={song.url}>Link to audio</a>
				<audio controls autoplay>
					<source src={song.url} type="audio/mpeg" />
					Your browser does not support the audio element.
				</audio>

				<audio src={song.url} class="h-8 w-8" />
			{:else}
				<p>Failed to get audio URL</p>
			{/if}
		{/if}
	{/key}
	{#key list}
		{#if !list.root}
			<a
				href={$page.url.pathname
					.split('/')
					.slice(0, data.song ? -2 : -1)
					.join('/')}
			>
				Seeing playlist: {list.name}
			</a>
		{:else}
			<p>Seeing playlist: /</p>
		{/if}
		{#each list.files as file}
			<a
				href="{$page.url.pathname || ''}/{file.filename}"
				class="flex items-center space-x-2 h-16 w-fit"
			>
				<img src={file.cover || '/favicon.png'} alt="Cover" class="aspect-square h-full" />
				<p>{file.filename}</p>
			</a>
		{/each}
	{/key}
</div>
