import { browser } from '$app/environment';
import { writable, type Writable } from 'svelte/store';

export const loop_type: Writable<string> = writable(
	browser ? window.localStorage.getItem('loop_type') ?? '0' : '0'
);

loop_type.subscribe((value) => {
	if (browser) {
		window.localStorage.setItem('loop_type', value);
	}
});
