import { browser } from '$app/environment';
import { writable, type Writable } from 'svelte/store';

export const loop_type: Writable<'none' | 'list' | 'song'> = writable(
	browser
		? (window.localStorage.getItem('loop_type') as 'none' | 'list' | 'song') ?? 'none'
		: 'none'
);

loop_type.subscribe((value) => {
	if (browser) {
		window.localStorage.setItem('loop_type', value);
	}
});
