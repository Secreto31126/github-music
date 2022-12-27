import { Octokit } from '@octokit/rest';

export async function getRepoList(auth: string) {
	const octokit = new Octokit({ auth });
	return await octokit.repos.listForAuthenticatedUser();
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

export async function getRepoFile(auth: string, owner: string, repo: string, path = '') {
	const octokit = new Octokit({ auth });
	return await octokit.repos.getContent({
		owner,
		repo,
		path
	});
}
