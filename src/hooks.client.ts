import { inject } from '@vercel/analytics';

inject({
	mode: import.meta.env.DEV ? 'development' : 'production',
	beforeSend: (event) => {
		const url = new URL(event.url);

		if (url.pathname.startsWith('/listen')) {
			// ['', 'listen', 'name'?, 'repo'?, 'branch'?, '...path'?]
			const path = url.pathname.split('/').slice(0, 6);

			if (path[2]) path[2] = '[name]';
			if (path[3]) path[3] = '[repo]';
			if (path[4]) path[4] = '[branch]';
			if (path[5]) path[5] = '[...path]';

			url.pathname = path.join('/');
		}

		return {
			...event,
			url: url.toString()
		};
	}
});
