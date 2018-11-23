import { app, Menu } from 'electron';

export function installMenu (openFunction, closeFunction) {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open Character…',
          accelerator: 'CommandOrControl+O',
          click: openFunction,
        },
        {
          label: 'Close Character',
          accelerator: 'CommandOrControl+W',
          enabled: false,
          click: closeFunction,
        },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
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
        // { label: 'Alternate Packing', type: 'checkbox', click: setOptions },
        { type: 'separator' },
        { label: 'Redisplay', accelerator: 'CommandOrControl+R', click: redisplay },
        { role: 'togglefullscreen' },
      ],
    },
    {
      role: 'window',
      submenu: [
        { role: 'minimize' },
        { role: 'close', accelerator: 'CommandOrControl+Shift+W' },
      ],
    },
  ];

  if (process.platform === 'darwin') {
    template[0].submenu.splice(1, 0, {
      role: 'recentdocuments',
      submenu: [{ role: 'clearrecentdocuments' }],
    });
    template[0].submenu.splice(-2, 2);
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
      { role: 'close', accelerator: 'CommandOrControl+Shift+W' },
      { role: 'minimize' },
      { role: 'zoom' },
      { type: 'separator' },
      { role: 'front' },
    ];
  }

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

const closeItemIndex = process.platform === 'darwin' ? 2 : 1;

export function enableCloseCharacter () {
  for (const menu of Menu.getApplicationMenu().items) {
    if (menu.label === 'File') {
      menu.submenu.items[closeItemIndex].enabled = true;
      break;
    }
  }
}

export function disableCloseCharacter () {
  for (const menu of Menu.getApplicationMenu().items) {
    if (menu.label === 'File') {
      menu.submenu.items[closeItemIndex].enabled = false;
      break;
    }
  }
}

export function enableView () {
  for (const menu of Menu.getApplicationMenu().items) {
    if (menu.label === 'View') {
      for (const item of menu.submenu.items) {
        if (item.label && !item.role) {
          // Let the framework take care of items with roles.
          item.enabled = true;
        }
      }
      break;
    }
  }
}

export function disableView () {
  for (const menu of Menu.getApplicationMenu().items) {
    if (menu.label === 'View') {
      for (const item of menu.submenu.items) {
        if (item.label && !item.role) {
          item.enabled = false;
        }
      }
      break;
    }
  }
}

let topdown = false;
// let pack = false;

function setOptions (item, win) {
  if (item.label === 'Top-Down Layout') {
    topdown = item.checked;
  // } else if (item.label === 'Alternate Packing') {
  //   pack = item.checked;
  }
  win.webContents.send('setOptions', { topdown, pack: false });
}

function redisplay (item, win) {
  win.webContents.send('redisplay');
}
