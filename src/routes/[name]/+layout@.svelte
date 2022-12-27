<script lang="ts">
	import type { LayoutData } from './$types';
	export let data: LayoutData;

	import { signOut } from '@auth/sveltekit/client';
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

<slot />
