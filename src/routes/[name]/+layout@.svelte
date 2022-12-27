<script lang="ts">
	import type { LayoutData } from './$types';
	export let data: LayoutData;

	import { signOut } from '@auth/sveltekit/client';

	const interval = new Promise<void>((resolve) => {
		setTimeout(() => {
			resolve();
		}, 5000);
	});
</script>

<header class="fixed top-0 left-0 w-full h-14 flex items-center justify-between py-2 bg-white z-50">
	<a href="/" class="h-full">
		<img src="/favicon.png" alt="Logo" class="aspect-square h-full" />
	</a>
	<div class="flex gap-2 items-center justify-end mr-2">
		<div class="text-right">
			<p>
				<strong>@{data.session?.user?.name}</strong>
			</p>
			<button on:click={() => signOut()} class="button">Sign out</button>
		</div>
		{#if data.session?.user?.image}
			<img src={data.session.user.image} alt="Avatar" class="aspect-square w-10 rounded-full" />
		{/if}
	</div>
</header>

<main class="my-16">
	<slot />
</main>

<footer class="fixed bottom-0 left-0 w-full h-16 text-center bg-white">
	{#await interval}
		<p class="py-2 bg-red-600">Reload detected</p>
	{:then _}
		<p class="py-2">Footer</p>
	{/await}
</footer>
