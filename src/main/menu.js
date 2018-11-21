import { app, Menu } from 'electron';

export function installMenu () {
  const template = [
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'delete' },
        { role: 'selectall' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { label: 'Top-Down Layout', type: 'checkbox', click: setOptions },
        { label: 'Alternate Packing', type: 'checkbox', click: setOptions },
        { type: 'separator' },
        { label: 'Redisplay', accelerator: 'CommandOrControl+R', click: redisplay },
        { role: 'togglefullscreen' },
      ],
    },
    {
      role: 'window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' },
      ],
    },
  ];

  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services', submenu: [] },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideothers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    });
    template[template.length - 1].submenu = [
      { role: 'close' },
      { role: 'minimize' },
      { role: 'zoom' },
      { type: 'separator' },
      { role: 'front' },
    ];
  }

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

let topdown = false;
let pack = false;

function setOptions (item, win) {
  if (item.label === 'Top-Down Layout') {
    topdown = item.checked;
  } else if (item.label === 'Alternate Packing') {
    pack = item.checked;
  }
  win.webContents.send('setOptions', { topdown, pack });
}

function redisplay (item, win) {
  win.webContents.send('redisplay');
}
