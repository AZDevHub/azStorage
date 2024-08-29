// Add this line at the top to ensure it's treated as a module
'use strict'; // or 'module' in a browser context

module.exports = {
    presets: [
        [
            '@babel/preset-env',
            {
                targets: {
                    node: 'current'
                }
            }
        ]
    ]
}