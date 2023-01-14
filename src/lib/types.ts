export type Song = {
	display_name: string;
	path: string;
	cover_path: string | null;
};

export type File = {
	display_name: string;
	filename: string;
	cover_url: string | null;
	type: 'folder' | 'song';
};
