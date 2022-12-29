<script lang="ts">
	import type { Song } from './types';

	import { browser } from '$app/environment';
	import { getParentPath } from '$lib/paths';
	import { loop_type } from '$lib/stores';
	import { onDestroy, onMount } from 'svelte';
	import getFileUrl from '$lib/getFileUrl';

	export let index = 0;
	export let songs: Array<Song> | null;
	export let origin: URL;

	let retries = 0;
	let last_requested: string;
	let url = null as string | null;
	let cover = null as string | null;

	let name_strcpy: string;
	$: if (songs) {
		name_strcpy = songs[index].name;
	}

	let player: HTMLAudioElement;
	let playing = false;

	//#region Player Comands
	function play() {
		player.play();
	}

	function pause() {
		player.pause();
	}

	function toggle() {
		if (player.paused) {
			player.play();
		} else {
			player.pause();
		}
	}

	function stop() {
		player.pause();
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
			$loop_type = 1;
		}

		// 01 loop list -> 10 loop song
		else if (!loop_song && loop_list) {
			loop_song = true;
			loop_list = false;
			$loop_type = 2;
		}

		// 10 loop song -> 00 default
		else {
			loop_song = false;
			$loop_type = 0;
		}
	}
	//#endregion

	$: if (browser && songs?.[index] && url && 'mediaSession' in navigator) {
		navigator.mediaSession.metadata = new MediaMetadata({
			title: songs[index].name,
			artwork: [{ src: songs[index].cover || '/favicon.png', type: 'image/png' }]
		});

		navigator.mediaSession.setActionHandler('play', play);
		navigator.mediaSession.setActionHandler('pause', pause);
		navigator.mediaSession.setActionHandler('seekbackward', backward);
		navigator.mediaSession.setActionHandler('seekforward', foward);
		navigator.mediaSession.setActionHandler('previoustrack', previous);
		navigator.mediaSession.setActionHandler('nexttrack', next);
	}

	function missingImg(event: Event) {
		const target = event.target as HTMLImageElement;
		target.src = '/favicon.png';
	}

	async function setupAudio() {
		if (!browser) return;

		if (!songs) {
			retries = 0;
			return;
		}

		if (last_requested !== songs[index].name) {
			retries = 0;
		}

		if (retries < 3) {
			retries++;
			last_requested = songs[index].name;
			url = await getFileUrl(`${getParentPath(origin.pathname, 1)}/${songs[index].name}`, fetch);
			cover = await getFileUrl(`${getParentPath(origin.pathname, 1)}/${songs[index].cover}`, fetch);
		} else {
			url = null;
			retries = 0;
		}
	}

	onMount(() => {
		if ($loop_type == 1) {
			loop_list = true;
		}

		if ($loop_type == 2) {
			loop_song = true;
		}

		setupAudio();
	});

	// Copilot insisted on this
	onDestroy(() => {
		if (player) {
			player.pause();
			player.src = '';
		}
	});

	$: index, setupAudio();

	$: if (browser && player) {
		player.loop = loop_song;
	}
</script>

<div class="flex justify-center items-center bg-orange-100 w-full h-full gap-2">
	<img
		src={cover || '/favicon.png'}
		alt="Cover"
		on:error={missingImg}
		class="aspect-square h-2/3"
	/>
	<div class="flex flex-col w-1/4">
		<a href="{getParentPath(origin.pathname, 1)}{origin.search}">{name_strcpy}</a>
		{#key url}
			{#if url}
				<audio
					bind:this={player}
					on:play={() => (playing = true)}
					on:pause={() => (playing = false)}
					on:ended={next}
					autoplay
					preload="auto"
				>
					<source src={url} on:error={setupAudio} on:canplay={() => (retries = 0)} />
					Your browser does not support the audio element.
				</audio>

				<div class="flex justify-evenly [&>*]:w-6">
					<button on:click={previous}>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36">
							<path fill="#000" d="M9 18L21 7v9.166L31 7v22l-10-9.167V29zm0 11H5V7h4z" />
						</svg>
					</button>

					<button on:click={stop} title="Stop">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36">
							<path fill="#000" d="M7 7h22v22H7z" />
						</svg>
					</button>

					<button on:click={toggle} title={playing ? 'Pause' : 'Play'}>
						{#if playing}
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36">
								<path fill="#000" d="M20 7h5v22h-5zm-9 0h5v22h-5z" />
							</svg>
						{:else}
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36">
								<path fill="#000" d="M8 7l22 11L8 29z" />
							</svg>
						{/if}
					</button>

					<button on:click={loop} title="Loop">
						{#if !player?.loop}
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36">
								<!-- <path fill="#3B88C3" d="M36 32c0 2.209-1.791 4-4 4H4c-2.209 0-4-1.791-4-4V4c0-2.209 1.791-4 4-4h28c2.209 0 4 1.791 4 4v28z"/> -->
								<path
									fill="#{loop_list ? '0F0' : '000'}"
									d="M30.2 10L23 4v4h-8C9.477 8 5 12.477 5 18c0 1.414.297 2.758.827 3.978l3.3-2.75C9.044 18.831 9 18.421 9 18c0-3.314 2.686-6 6-6h8v4l7.2-6zm-.026 4.023l-3.301 2.75c.083.396.127.806.127 1.227 0 3.313-2.687 6-6 6h-8v-4l-7.2 6 7.2 6v-4h8c5.522 0 10-4.478 10-10 0-1.414-.297-2.758-.826-3.977z"
								/>
							</svg>
						{:else}
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36">
								<path
									fill="#0F0"
									d="M30.174 14.023l-3.301 2.75c.083.396.127.806.127 1.227 0 3.313-2.687 6-6 6h-1.059c.037.329.059.662.059 1 0 1.054-.19 2.06-.523 3H21c5.522 0 10-4.478 10-10 0-1.414-.297-2.758-.826-3.977zM30.2 10L23 4v4h-8C9.477 8 5 12.477 5 18c0 .099.012.194.015.292 1.186-1.059 2.649-1.812 4.273-2.125C10.062 13.75 12.326 12 15 12h8v4l7.2-6z"
								/>
								<circle fill="#0F0" cx="11" cy="25" r="6" />
								<path
									fill="#FFF"
									d="M10.201 23.116h-.708c-.576 0-.815-.42-.815-.828 0-.419.3-.827.815-.827h1.703c.516 0 .804.371.804.852v5.752c0 .6-.384.935-.899.935s-.899-.336-.899-.935v-4.949z"
								/>
							</svg>
						{/if}
					</button>

					<button on:click={next}>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36">
							<path fill="#000" d="M27 18L15 7v9.166L5 7v22l10-9.167V29zm0-11h4v22h-4z" />
						</svg>
					</button>
				</div>
			{:else if retries < 3}
				<p>Loading...</p>
			{:else}
				<p>Failed to get URL</p>
			{/if}
		{/key}
	</div>
</div>
