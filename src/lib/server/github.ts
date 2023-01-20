import { Octokit } from '@octokit/rest';

export async function getUser(auth: string) {
	const octokit = new Octokit({ auth });
	return await octokit.users.getAuthenticated();
}

export async function getRepoList(auth: string) {
	const octokit = new Octokit({ auth });
	return await octokit.repos.listForAuthenticatedUser({
		per_page: 100
	});
}

export async function getRepoListOf(auth: string, username: string) {
	const octokit = new Octokit({ auth });
	return await octokit.repos.listForUser({ username, per_page: 100 });
}

export async function getRepoStructure(auth: string, owner: string, repo: string, branch = 'main') {
	const octokit = new Octokit({ auth });
	const commit = await octokit.git.getRef({
		owner,
		repo,
		ref: `heads/${branch}`
	});
	return await octokit.git.getTree({
		owner,
		repo,
		recursive: '1',
		tree_sha: commit.data.object.sha
	});
}

export async function getRepoFile(
	auth: string,
	owner: string,
	repo: string,
	path = '',
	ref = 'main'
) {
	const octokit = new Octokit({ auth });
	return await octokit.repos.getContent({
		owner,
		repo,
		path,
		ref
	});
}

export async function getSymlinkTarget(
	auth: string,
	owner: string,
	repo: string,
	path: string,
	ref: string | undefined
): Promise<string | null> {
	try {
		const request = await getRepoFile(auth, owner, repo, path, ref);

		/**
		 * Ironic, data.type === "symlink" isn't our supported symlink type
		 * @see https://docs.github.com/en/rest/repos/contents?apiVersion=2022-11-28#if-the-content-is-a-symlink
		 */
		if (Array.isArray(request.data) || request.data.type !== 'file' || !request.data.download_url) {
			return null;
		}

		// Just hope the user isn't wrong and the file is a symlink
		const response = await fetch(request.data.download_url);
		return await response.text();
	} catch (error) {
		return null;
	}
}
