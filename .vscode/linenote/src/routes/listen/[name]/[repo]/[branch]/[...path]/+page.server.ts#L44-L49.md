Detect if it's a file or symlink, and instead of an object set a number
(0 for file, 1 for symlink) and then think of a way to store the
symlink target.
