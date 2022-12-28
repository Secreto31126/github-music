<script lang="ts">
	import { page } from '$app/stores';
</script>

<h1 class="ml-2">{$page.status}: {$page.error?.message}</h1>
