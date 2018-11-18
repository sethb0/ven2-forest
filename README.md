# ven2-forest

_Exalted_ 2.5e Charm tree visualization on the desktop

## Building

Needs Node.js v10 or later. Not tested on anything but a Mac. Will probably work on Windows or Linux though, with minor mods to `vue.config.js`. Send a PR if you get it working, please!

1.  Clone the repo.
1.  `npm install`
1.  Copy `lite.render.js` from `node_modules/viz.js` to `public`. The build toolchain does not make this easy to do automatically.
1.  `npm run electron:build`
1.  The installation package will be in the `dist_electron` subdirectory. As configured, that will be a MacOS `.dmg` file.

## Getting access to the Charm database so you can actually use the software

Not unless you're a player in one of my games, you're not. Feel free to reverse-engineer the database structure and then spend weeks on data entry, just like I did.
