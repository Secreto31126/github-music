<script lang="ts">
	import { browser } from '$app/environment';

	export let song: {
		name: string;
		path: string;
		url: string | null;
		cover: string | null;
	} | null;

	let name_strcpy: string;
	$: if (song) {
		name_strcpy = song.name;
	}

	export let origin: string;

	let player: HTMLAudioElement;
	let playing = false;

	function missingImg(event: Event) {
		const target = event.target as HTMLImageElement;
		target.src = '/favicon.png';
	}

	function play() {
		player.play();
	}

	function pause() {
		player.pause();
	}

	function toggle() {
		if (player.paused) {
			console.log('play');
			player.play();
		} else {
			console.log('pause');
			player.pause();
		}
	}

	function stop() {
		player.pause();
		song = null;
	}

	function backward() {
		player.currentTime -= 10;
	}

	function foward() {
		player.currentTime += 10;
	}

	function loop() {
		player.loop = !player.loop;
	}

	$: if (browser && song?.cover && 'mediaSession' in navigator) {
		navigator.mediaSession.metadata = new MediaMetadata({
			title: song.name,
			artwork: [{ src: song.cover || '/favicon.png', type: 'image/png' }]
		});

		navigator.mediaSession.setActionHandler('play', play);
		navigator.mediaSession.setActionHandler('pause', pause);
		navigator.mediaSession.setActionHandler('seekbackward', backward);
		navigator.mediaSession.setActionHandler('seekforward', foward);

		// navigator.mediaSession.setActionHandler('previoustrack', function () {});
		// navigator.mediaSession.setActionHandler('nexttrack', function () {});
	}
</script>

<div class="flex justify-center items-center bg-orange-100 w-full h-full gap-2">
	<img
		src={song?.cover || '/favicon.png'}
		alt="Cover"
		on:error={missingImg}
		class="aspect-square h-2/3"
	/>
	<div class="flex flex-col">
		<a href={origin}>{name_strcpy}</a>
		{#key song?.url}
			{#if song?.url}
				<audio
					bind:this={player}
					on:play={() => (playing = true)}
					on:pause={() => (playing = false)}
					autoplay
				>
					<source src={song.url} type="audio/mpeg" />
					Your browser does not support the audio element.
				</audio>

				<div class="flex justify-evenly [&>*]:w-6">
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
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36">
							<!-- <path
								fill="#{player?.loop ? '0F0' : '000'}"
								d="M36 32c0 2.209-1.791 4-4 4H4c-2.209 0-4-1.791-4-4V4c0-2.209 1.791-4 4-4h28c2.209 0 4 1.791 4 4v28z"
							/> -->
							<path
								fill="#{player?.loop ? '0F0' : '000'}"
								d="M30.174 14.023l-3.301 2.75c.083.396.127.806.127 1.227 0 3.313-2.687 6-6 6h-1.059c.037.329.059.662.059 1 0 1.054-.19 2.06-.523 3H21c5.522 0 10-4.478 10-10 0-1.414-.297-2.758-.826-3.977zM30.2 10L23 4v4h-8C9.477 8 5 12.477 5 18c0 .099.012.194.015.292 1.186-1.059 2.649-1.812 4.273-2.125C10.062 13.75 12.326 12 15 12h8v4l7.2-6z"
							/>
							<circle fill="#{player?.loop ? '0F0' : '000'}" cx="11" cy="25" r="6" />
							<path
								fill="#FFF"
								d="M10.201 23.116h-.708c-.576 0-.815-.42-.815-.828 0-.419.3-.827.815-.827h1.703c.516 0 .804.371.804.852v5.752c0 .6-.384.935-.899.935s-.899-.336-.899-.935v-4.949z"
							/>
						</svg>
					</button>
				</div>
			{:else}
				<p>Failed to get audio URL</p>
			{/if}
		{/key}
	</div>
</div>
