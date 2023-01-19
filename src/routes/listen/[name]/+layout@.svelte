<script lang="ts">
	import type { LayoutData } from './$types';
	import { page } from '$app/stores';

	export let data: LayoutData;
</script>

<header class="fixed top-0 left-0 w-full h-14 flex items-center justify-between py-2 z-50">
	<a href="/{$page.url.pathname.split('/').slice(1, 4).join('/')}" class="h-full">
		<img src="/svelte.png" alt="Logo" class="aspect-square h-full" />
	</a>
	<div class="flex gap-2 items-center justify-end mr-2">
		<div class="text-right text-contrast">
			<p class="font-bold">@{data.username || 'Unknown'}</p>
			<a href="/listen/{$page.params.name}">Change repo</a>
		</div>
		{#if data.avatar_url}
			<a href="/user" class="w-fit h-fit" title="Account">
				<img src={data.avatar_url} alt="Avatar" class="aspect-square w-10 rounded-full" />
			</a>
		{/if}
	</div>
</header>

<div class="fixed w-full h-14 z-10" id="blur" />

<div class="pt-16 w-full min-h-screen overflow-hidden bg-gradient-to-t from-primary to-gradient">
	<slot />
</div>

<style>
	#blur {
		mask: linear-gradient(
			rgba(0, 0, 0, 1),
			rgba(0, 0, 0, 0.8),
			rgba(0, 0, 0, 0.6),
			rgba(0, 0, 0, 0.4),
			rgba(0, 0, 0, 0.2),
			rgba(0, 0, 0, 0)
		);

		backdrop-filter: blur(calc(3.5rem / 6));
	}
</style>
