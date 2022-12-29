import { browser } from '$app/environment';
import { writable } from 'svelte/store';

export const loop_type = writable(browser ? window.localStorage.getItem('loop_type') ?? 0 : 0);

loop_type.subscribe((value) => {
	if (browser) {
		window.localStorage.setItem('loop_type', value.toString());
	}
});
