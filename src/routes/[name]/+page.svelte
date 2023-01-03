<script lang="ts">
	import { page } from '$app/stores';
	import type { PageData, ActionData } from './$types';

	export let data: PageData;
	export let form: ActionData;

	let repo = '';
	$: branch = repo ? data.repos.find((r) => r.name === repo)?.branch || 'main' : 'main';

	let error = $page.url.searchParams.get('error') || form?.message;
</script>

<svelte:head>
	<title>GitHub Music</title>
</svelte:head>

<main class="mx-2 mt-16 text-center">
	<form class="text-center flex flex-col md:block" method="post" action="?/repo">
		<div class="inline-block relative mb-2">
			<select
				name="repo"
				bind:value={repo}
				required
				class="block appearance-none w-full bg-white border border-gray-400 hover:border-gray-500 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
			>
				<option value="" class="text-primary">Pick a repo</option>
				{#each data.repos as repo}
					<option value={repo.name} class="text-primary">{repo.name}</option>
				{/each}
			</select>
			<div
				class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700"
			>
				<svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
					<path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
				</svg>
			</div>
		</div>
		<input
			name="branch"
			type="text"
			value={repo ? branch : ''}
			placeholder="Branch ({branch})"
			class="text-center shadow appearance-none border rounded py-2 px-3 mb-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
		/>
		<button
			type="submit"
			class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 mb-2 rounded focus:outline-none focus:shadow-outline"
		>
			Scan
		</button>
	</form>
	{#if error}
		<p class="text-secondary">{error}</p>
	{/if}
</main>
