<script lang="ts">
	import type { LayoutData } from './$types';
	import { page } from '$app/stores';

	export let data: LayoutData;
</script>

<header class="fixed top-0 left-0 w-full h-14 flex items-center justify-between py-2 z-50">
	<a href="/{$page.url.pathname.split('/').slice(1, 3).join('/')}{$page.url.search}" class="h-full">
		<img src="/favicon.png" alt="Logo" class="aspect-square h-full" />
	</a>
	<div class="flex gap-2 items-center justify-end mr-2">
		<div class="text-right text-contrast">
			<p class="font-bold">@{data.session?.user?.name}</p>
			<a href="/{$page.url.pathname.split('/').at(1)}">Change repo</a>
		</div>
		{#if data.session?.user?.image}
			<a href="/user" class="w-fit h-fit" title="Account">
				<img src={data.session.user.image} alt="Avatar" class="aspect-square w-10 rounded-full" />
			</a>
		{/if}
	</div>
</header>

<div class="pt-16 w-full min-h-screen overflow-hidden bg-gradient-to-t from-primary to-gradient">
	<slot />
</div>
