<script lang="ts">
	import { signOut } from '@auth/sveltekit/client';
	import { page } from '$app/stores';
</script>

<div>
	{#if $page.data.session?.user?.image}
		<span style="background-image: url('{$page.data.session.user.image}')" class="avatar" />
	{/if}
	<p class="signedInText">
		<small>Signed in as</small><br />
		<strong>{$page.data.session?.user?.email || $page.data.session?.user?.name}</strong>
	</p>
	<button on:click={() => signOut()} class="button">Sign out</button>
</div>

<style>
	.avatar {
		display: block;
		width: 100px;
		height: 100px;
		border-radius: 50%;
		background-size: cover;
		background-position: center;
		margin: 0 auto;
	}

	.signedInText {
		text-align: center;
	}

	.button {
		display: block;
		margin: 0 auto;
	}
</style>
