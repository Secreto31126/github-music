export function getParentPath(path: string, i: number): string {
	return path.split('/').slice(0, -i).join('/');
}
