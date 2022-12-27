import { SvelteKitAuth } from '@auth/sveltekit';
import GitHub from '@auth/core/providers/github';
import { GITHUB_ID, GITHUB_SECRET } from '$env/static/private';

export const handle = SvelteKitAuth({
	providers: [
		/**
		 * @see https://github.com/nextauthjs/next-auth/issues/6174
		 */
		/* eslint-disable */
		// @ts-ignore
		GitHub({
			clientId: GITHUB_ID,
			clientSecret: GITHUB_SECRET,
			authorization: {
				params: {
					scope: 'repo'
				}
			},
			profile(profile) {
				return {
					id: profile.id.toString(),
					name: profile.login,
					email: profile.email,
					image: profile.avatar_url
				};
			}
		})
	],
	callbacks: {
		async jwt({ token, account }) {
			if (account?.access_token) {
				token.access_token = account.access_token;
			}

			return token;
		},
		async session({ session, token }) {
			return {
				...session,
				access_token: token.access_token
			};
		}
	}
});
