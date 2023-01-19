import { Octokit } from '@octokit/rest';

export async function getUsername(auth: string) {
	const octokit = new Octokit({ auth });
	const user = await octokit.users.getAuthenticated();
	return user.data.login;
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
