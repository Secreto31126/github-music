<script lang="ts">
	import type { PageData } from './$types';

	import { page } from '$app/stores';
	import { fade, fly } from 'svelte/transition';

	export let data: PageData;

	let song: {
		name: string;
		path: string;
		url: string | null;
		cover: string | null;
	} | null = null;

	$: if (data.song && data.song.path !== song?.path) {
		console.log(data.song.cover);
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

	function missingImg(event: Event) {
		const target = event.target as HTMLImageElement;
		target.src = '/favicon.png';
	}
</script>

<svelte:head>
	<title>{song ? song.name : list ? list.name : 'GitHub Music'}</title>
</svelte:head>

<main class="flex flex-col gap-4 mx-2 my-16">
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
			href="{data.song
				? $page.url.pathname.split('/').slice(0, -1).join('/')
				: $page.url.pathname}/{file.filename}"
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
		<span class="mb-16" />
	{/if}
</main>

{#if song}
	<footer
		class="fixed bottom-0 left-0 flex w-full h-32 text-center bg-gray-100"
		transition:fly={{ y: 200 }}
	>
		<div class="flex justify-center items-center w-full h-full gap-2" transition:fade>
			<img
				src={song.cover || '/favicon.png'}
				alt="Cover"
				on:error={missingImg}
				class="aspect-square h-2/3"
			/>
			<div class="flex flex-col gap-2">
				<p>{song.name}</p>
				{#key song.url}
					{#if song.url}
						<audio controls autoplay>
							<source src={song.url} type="audio/mpeg" />
							Your browser does not support the audio element.
						</audio>
					{:else}
						<p>Failed to get audio URL</p>
					{/if}
				{/key}
			</div>
		</div>
	</footer>
{/if}
