export default async function getFileUrl(path: string, fetch: typeof window.fetch) {
	try {
		const request = await fetch(path);
		if (request.ok) {
			return await request.text();
		} else {
			return null;
		}
	} catch (error) {
		console.error(error);
		return null;
	}
}
