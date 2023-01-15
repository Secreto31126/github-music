<script lang="ts">
	import type { File } from '$lib/types';

	export let href: string;
	export let file: File;

	function missingImg(event: Event) {
		const target = event.target as HTMLImageElement;
		target.src = '/svelte.png';
	}
</script>

<a {href} class="w-40 sm:w-56">
	<div
		class="flex flex-col items-center gap-x-4 rounded-md hover:shadow-xl hover:bg-gradient hover:bg-opacity-25 transition-all duration-300 p-4 h-full"
	>
		<img
			src={file.cover_url || '/svelte.png'}
			alt="Cover"
			on:error={missingImg}
			class="aspect-square w-full object-cover rounded-md"
			loading="lazy"
		/>
		<p class="text-contrast text-center">
			{file.display_name}
		</p>
	</div>
</a>
