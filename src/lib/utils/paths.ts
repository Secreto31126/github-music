export function getParentPath(path: string, i: number): string {
	return path.split('/').slice(0, -i).join('/');
}

export function getName(path: string, i: number): string | null {
	return path.split('/').at(-i) || null;
}

export function removeExtension(filename: string): string {
	return filename.split('.').slice(0, -1).join('.');
}

export function getExtension(filename: string): string {
	return filename.toLowerCase().split('.').pop() ?? '';
}
