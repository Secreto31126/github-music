<script lang="ts">
	import type { File } from '$lib/types';

	export let href: string;
	export let file: File;

	function missingImg(event: Event) {
		const target = event.target as HTMLImageElement;
		target.src = '/svelte.png';
	}
</script>

<a {href} data-sveltekit-noscroll={file.type === 'folder' ? 'off' : ''}>
	<div
		class="flex items-center gap-x-4 rounded-md hover:shadow-xl transition-shadow duration-300 pr-4 h-20 overflow-hidden"
	>
		<img
			src={file.cover_url || '/svelte.png'}
			alt="Cover"
			on:error={missingImg}
			class="aspect-square h-full object-cover"
			loading="lazy"
		/>
		<p class="text-contrast">
			{file.display_name}
		</p>
	</div>
</a>
