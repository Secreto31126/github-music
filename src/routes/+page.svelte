<svelte:head>
	<title>GitHub Music</title>
</svelte:head>

<main
	class="flex flex-col items-center gap-4 py-4 bg-gradient-to-l from-gradient to-primary w-full min-h-screen text-contrast"
>
	<h1 class="text-3xl font-bold">GitHub Music</h1>
	<a
		href="/login"
		class="border-2 border-contrast rounded-full py-1 px-4 hover:bg-gradient hover:px-6"
		style="transition: background-color 0.4s ease-in-out, padding 0.15s ease-in-out;"
	>
		Start listening!
	</a>
	<picture class="w-5/6">
		<source media="(min-width: 768px)" srcset="home.png" />
		<img src="mobile.png" alt="The Home Page of GitHub Music" />
	</picture>
</main>
