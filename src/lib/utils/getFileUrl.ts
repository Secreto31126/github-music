export default async function getFileUrl(
	name: string,
	repo: string,
	branch: string,
	path: string,
	fetch: typeof window.fetch
) {
	try {
		const request = await fetch(`/listen/${name}/${repo}/${branch}/${path}`);
		if (request.ok) {
			return await request.text();
		} else {
			console.error((await request.json()).message);
			return null;
		}
	} catch (error) {
		console.error(error);
		return null;
	}
}
