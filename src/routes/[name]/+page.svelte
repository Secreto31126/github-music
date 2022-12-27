<script lang="ts">
	import type { PageData, ActionData } from './$types';

	export let data: PageData;
	export let form: ActionData;
</script>

<div class="text-center">
	<form class="text-center" method="post" action="?/repo">
		<select name="repo" required class="text-center cursor-pointer">
			<option value="">Pick a repo</option>
			{#each data.repos as repo}
				<option value={repo}>{repo}</option>
			{/each}
		</select>
		<input name="branch" type="text" placeholder="Branch" class="text-center underline" />
		<button type="submit" class="text-center px-8">Scan</button>
	</form>
	{#if form?.message}
		<p class="text-red-600">{form.message}</p>
	{/if}
</div>
