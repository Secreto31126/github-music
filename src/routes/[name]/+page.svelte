<script lang="ts">
	import type { PageData, ActionData } from './$types';

	export let data: PageData;
	export let form: ActionData;

	let repo = '';
	$: branch = repo ? data.repos.find((r) => r.name === repo)?.branch || 'main' : 'main';
</script>

<main class="mx-2 my-16 text-center">
	<form class="text-center" method="post" action="?/repo">
		<select name="repo" bind:value={repo} required class="text-center cursor-pointer">
			<option value="">Pick a repo</option>
			{#each data.repos as repo}
				<option value={repo.name}>{repo.name}</option>
			{/each}
		</select>
		<input
			name="branch"
			type="text"
			value={repo ? branch : ''}
			placeholder="Branch ({branch})"
			class="text-center"
		/>
		<button type="submit" class="text-center px-8">Scan</button>
	</form>
	{#if form?.message}
		<p class="text-red-600">{form.message}</p>
	{/if}
</main>
