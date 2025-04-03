module.exports = {
	...require('@wordpress/prettier-config'),
	printWidth: 114, // When format on save, this will realign long lines
	overrides: [
		{
			files: '*.md', // Target only markdown files
			options: {
				proseWrap: 'preserve', // Preserve wrapping in markdown files
			},
		},
	],
};
