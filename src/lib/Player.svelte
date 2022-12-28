<script lang="ts">
	import { browser } from '$app/environment';

	export let song: {
		name: string;
		path: string;
		url: string | null;
		cover: string | null;
	};

	function missingImg(event: Event) {
		const target = event.target as HTMLImageElement;
		target.src = '/favicon.png';
	}

	$: if (browser && song.cover && 'mediaSession' in navigator) {
		navigator.mediaSession.metadata = new MediaMetadata({
			title: song.name,
			artwork: [{ src: song.cover || '/favicon.png', type: 'image/png' }]
		});

		navigator.mediaSession.setActionHandler('play', function () {});
		navigator.mediaSession.setActionHandler('pause', function () {});
		navigator.mediaSession.setActionHandler('seekbackward', function () {});
		navigator.mediaSession.setActionHandler('seekforward', function () {});
		navigator.mediaSession.setActionHandler('previoustrack', function () {});
		navigator.mediaSession.setActionHandler('nexttrack', function () {});
	}
</script>

<div class="flex justify-center items-center w-full h-full gap-2">
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
