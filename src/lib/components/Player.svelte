<script lang="ts">
	import type { Song } from '$lib/types';
	import type { Page } from '@sveltejs/kit';

	import { browser } from '$app/environment';
	import { getParentPath } from '$lib/utils/paths';
	import { loop_type } from '$lib/stores';
	import { onDestroy, onMount } from 'svelte';
	import getFileUrl from '$lib/utils/getFileUrl';

	export let index = 0;
	export let songs: Array<Song> | null;
	export let origin: Page<Record<string, string>, string | null>;

	let retries = 0;
	let last_requested: string;
	let url = null as string | null;
	let cover = null as string | null;
	let progress = 0;
	let duration = 0;

	$: percent = (progress / (duration || 1)) * 100;

	let name_strcpy: string;
	$: if (songs) {
		name_strcpy = songs[index].display_name;
	}

	let player: HTMLAudioElement;
	let paused = true;

	//#region Player Comands
	function play() {
		player.play();
	}

	function pause() {
		player.pause();
	}

	function toggle() {
		if (paused) {
			play();
		} else {
			pause();
		}
	}

	function stop() {
		pause();
		songs = null;
	}

	function backward() {
		player.currentTime -= 10;
	}

	function foward() {
		player.currentTime += 10;
	}

	let loop_list = false;
	let loop_song = false;

	function previous() {
		let temp = index - 1;
		if (temp < 0) {
			if (loop_list) {
				temp = (songs?.length || 0) - 1;
			} else {
				return;
			}
		}

		index = temp;
	}

	function next() {
		let temp = index + 1;
		if (loop_list) {
			temp %= songs?.length || 1;
		} else if ((songs?.length || 0) <= temp) {
			return;
		}

		index = temp;
	}

	function loop() {
		// 00 default -> 01 loop song
		if (!loop_song && !loop_list) {
			loop_list = true;
			$loop_type = '1';
		}

		// 01 loop list -> 10 loop song
		else if (!loop_song && loop_list) {
			loop_song = true;
			loop_list = false;
			$loop_type = '2';
		}

		// 10 loop song -> 00 default
		else {
			loop_song = false;
			$loop_type = '0';
		}
	}
	//#endregion

	$: {
		paused;
		if (browser && songs?.[index] && url && 'mediaSession' in navigator) {
			navigator.mediaSession.metadata = new MediaMetadata({
				title: songs[index].display_name,
				artwork: [{ src: cover || '/svelte.png', type: 'image/png' }]
			});

			navigator.mediaSession.setActionHandler('play', play);
			navigator.mediaSession.setActionHandler('pause', pause);
			navigator.mediaSession.setActionHandler('seekbackward', backward);
			navigator.mediaSession.setActionHandler('seekforward', foward);
			navigator.mediaSession.setActionHandler('previoustrack', previous);
			navigator.mediaSession.setActionHandler('nexttrack', next);
		}
	}

	function missingImg(event: Event) {
		const target = event.target as HTMLImageElement;
		target.src = '/svelte.png';
	}

	let progressBar: HTMLDivElement;
	$: progressBarRect = progressBar?.getBoundingClientRect();
	function barClick(event: MouseEvent) {
		if (player) {
			const x = event.clientX - progressBarRect.left;
			progress = (x * duration) / progressBar.offsetWidth;
		}
	}

	function keyboard(event: KeyboardEvent) {
		if (event.code === 'Space') {
			event.preventDefault();

			if (event.ctrlKey) {
				stop();
			} else {
				toggle();
			}
		}

		if (event.code === 'ArrowLeft') {
			event.preventDefault();

			if (event.ctrlKey) {
				previous();
			} else {
				backward();
			}
		}

		if (event.code === 'ArrowRight') {
			event.preventDefault();

			if (event.ctrlKey) {
				next();
			} else {
				foward();
			}
		}

		if (event.code === 'KeyL') {
			event.preventDefault();
			loop();
		}
	}

	async function setupAudio() {
		if (!browser) return;

		if (!songs) {
			retries = 0;
			return;
		}

		if (player) {
			pause();
			url = null;
		}

		let copy_progress = progress ?? 0;
		if (last_requested !== songs[index].path) {
			retries = 0;
			copy_progress = 0;
		}

		if (retries < 3) {
			retries++;
			last_requested = songs[index].path;

			url = await getFileUrl(
				origin.params.name,
				origin.params.repo,
				origin.params.branch,
				songs[index].path,
				fetch
			);

			if (!url) {
				setupAudio();
				return;
			}

			cover = songs[index].cover_path
				? await getFileUrl(
						origin.params.name,
						origin.params.repo,
						origin.params.branch,
						songs[index].cover_path,
						fetch
				  )
				: null;

			progress = copy_progress;
		} else {
			url = null;
		}
	}

	onMount(() => {
		if ($loop_type === '1') {
			loop_list = true;
		}

		if ($loop_type === '2') {
			loop_song = true;
		}
	});

	// Copilot insisted on this
	onDestroy(() => {
		if (player) {
			pause();
			player.src = '';
		}
	});

	$: index, origin, setupAudio();

	$: if (browser && player) {
		player.loop = loop_song;
	}
</script>

<svelte:window on:keydown={keyboard} />

<div class="flex flex-col w-full h-full bg-primary">
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<div class="w-full cursor-pointer" bind:this={progressBar} on:click={barClick}>
		<div class="bg-selected h-1 rounded-r-full" style="width: {percent}%" />
	</div>
	<div class="flex justify-center items-center w-full overflow-hidden gap-2 px-2">
		<img
			src={cover || '/svelte.png'}
			alt="Cover"
			on:error={missingImg}
			class="aspect-square h-2/3"
		/>
		<div class="flex flex-col w-full max-w-md">
			<a
				href={getParentPath(origin.url.pathname, 1)}
				class="whitespace-nowrap overflow-hidden text-ellipsis text-contrast text-lg"
			>
				{name_strcpy}
			</a>
			{#key url}
				{#if url}
					<audio
						bind:this={player}
						on:ended={next}
						on:error={setupAudio}
						on:abort={setupAudio}
						on:canplay={() => (retries = 0)}
						bind:currentTime={progress}
						bind:duration
						bind:paused
						autoplay
						preload="auto"
					>
						<source src={url} on:error={setupAudio} on:abort={setupAudio} />
						Your browser does not support the audio element.
					</audio>

					<div class="flex justify-evenly [&>*]:w-6">
						<button on:click={previous}>
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" class="fill-contrast">
								<path d="M9 18L21 7v9.166L31 7v22l-10-9.167V29zm0 11H5V7h4z" />
							</svg>
						</button>

						<button on:click={stop} title="Stop">
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" class="fill-contrast">
								<path d="M7 7h22v22H7z" />
							</svg>
						</button>

						<button on:click={toggle} title={paused ? 'Play' : 'Pause'}>
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" class="fill-contrast">
								{#if paused}
									<path d="M8 7l22 11L8 29z" />
								{:else}
									<path d="M20 7h5v22h-5zm-9 0h5v22h-5z" />
								{/if}
							</svg>
						</button>

						<button on:click={loop} title="Loop">
							{#if !player?.loop}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 36 36"
									class="fill-{loop_list ? 'selected' : 'contrast'}"
								>
									<!-- <path fill="#3B88C3" d="M36 32c0 2.209-1.791 4-4 4H4c-2.209 0-4-1.791-4-4V4c0-2.209 1.791-4 4-4h28c2.209 0 4 1.791 4 4v28z"/> -->
									<path
										d="M30.2 10L23 4v4h-8C9.477 8 5 12.477 5 18c0 1.414.297 2.758.827 3.978l3.3-2.75C9.044 18.831 9 18.421 9 18c0-3.314 2.686-6 6-6h8v4l7.2-6zm-.026 4.023l-3.301 2.75c.083.396.127.806.127 1.227 0 3.313-2.687 6-6 6h-8v-4l-7.2 6 7.2 6v-4h8c5.522 0 10-4.478 10-10 0-1.414-.297-2.758-.826-3.977z"
									/>
								</svg>
							{:else}
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" class="fill-selected">
									<path
										d="M30.174 14.023l-3.301 2.75c.083.396.127.806.127 1.227 0 3.313-2.687 6-6 6h-1.059c.037.329.059.662.059 1 0 1.054-.19 2.06-.523 3H21c5.522 0 10-4.478 10-10 0-1.414-.297-2.758-.826-3.977zM30.2 10L23 4v4h-8C9.477 8 5 12.477 5 18c0 .099.012.194.015.292 1.186-1.059 2.649-1.812 4.273-2.125C10.062 13.75 12.326 12 15 12h8v4l7.2-6z"
									/>
									<circle cx="11" cy="25" r="6" />
									<path
										class="fill-primary"
										d="M10.201 23.116h-.708c-.576 0-.815-.42-.815-.828 0-.419.3-.827.815-.827h1.703c.516 0 .804.371.804.852v5.752c0 .6-.384.935-.899.935s-.899-.336-.899-.935v-4.949z"
									/>
								</svg>
							{/if}
						</button>

						<button on:click={next}>
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" class="fill-contrast">
								<path d="M27 18L15 7v9.166L5 7v22l10-9.167V29zm0-11h4v22h-4z" />
							</svg>
						</button>
					</div>
				{:else if retries < 3}
					<p class="text-contrast">Loading...</p>
				{:else}
					<p class="text-contrast">Failed to get URL</p>
				{/if}
			{/key}
		</div>
	</div>
</div>
