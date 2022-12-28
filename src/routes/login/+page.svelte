<script lang="ts">
	import { signIn } from '@auth/sveltekit/client';
</script>

<button on:click={() => signIn('github')}>Sign In with GitHub</button>
