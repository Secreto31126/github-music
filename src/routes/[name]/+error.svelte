<script lang="ts">
	import { page } from '$app/stores';
</script>

<h1 class="ml-2 text-contrast">{$page.status}: {$page.error?.message}</h1>
