<script lang="ts">
	import type { LayoutData } from './$types';
	import { page } from '$app/stores';

	export let data: LayoutData;
</script>

<header class="fixed top-0 left-0 w-full h-14 flex items-center justify-between py-2 bg-white z-50">
	<a href="/{$page.url.pathname.split('/').slice(1, 3).join('/')}{$page.url.search}" class="h-full">
		<img src="/favicon.png" alt="Logo" class="aspect-square h-full" />
	</a>
	<div class="flex gap-2 items-center justify-end mr-2">
		<div class="text-right">
			<p>
				<strong>@{data.session?.user?.name}</strong>
			</p>
			<a href="/{$page.url.pathname.split('/').at(1)}">Change repo</a>
		</div>
		{#if data.session?.user?.image}
			<a href="/user" class="w-fit h-fit">
				<img src={data.session.user.image} alt="Avatar" class="aspect-square w-10 rounded-full" />
			</a>
		{/if}
	</div>
</header>

<div class="mt-16 w-full h-full">
	<slot />
</div>
