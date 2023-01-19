<script lang="ts">
	import type { PageData } from './$types';
	export let data: PageData;
</script>

<svelte:head>
	<title>GitHub Music ({data.username || 'User'})</title>
</svelte:head>

<div class="flex flex-col items-center">
	{#if data.avatar_url}
		<span style="background-image: url('{data.avatar_url}')" class="avatar" />
	{/if}
	<p class="signedInText">
		<small>Signed in as</small><br />
		<strong>{data.username}</strong>
	</p>
	<a href="/user/logout">Sign out</a>
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
</style>
