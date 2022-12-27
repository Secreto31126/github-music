<script lang="ts">
	import type { PageData } from './$types';
	import { page } from '$app/stores';

	export let data: PageData;

	let song: {
		name: string;
		path: string;
		url: string | null;
	} | null = null;

	$: if (data.song && data.song.path !== song?.path) {
		song = {
			name: data.song.path.split('/').pop() || 'Error',
			path: data.song.path,
			url: data.song.url || null
		};
	}

	$: list = data.list.path.split('/').at(data.song ? -2 : -1) || '/';
</script>

<svelte:head>
	<title>{song ? song.name : list}</title>
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
	{#if list !== '/'}
		<a href={($page.url.pathname || '').split('/').slice(0, -1).join('/')}>
			Seeing playlist: {list}
		</a>
	{:else}
		<p>Seeing playlist: /</p>
	{/if}
	{#each data.list.files as file}
		<a
			href="{$page.url.pathname || ''}/{file.filename}"
			class="flex items-center space-x-2 h-16 w-fit"
		>
			<img
				src={file.cover || data.list.cover || '/favicon.png'}
				alt=""
				class="aspect-square h-full"
			/>
			<p>{file.filename}</p>
		</a>
	{/each}
</div>
