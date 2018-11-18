import { app, Menu } from 'electron';

export function installMenu (/* handlers */) {
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
    // {
    //   label: 'View',
    //   submenu: [
    //     { label: 'Reload', accelerator: 'CommandOrControl+R', click: handlers.reload },
    //     { type: 'separator' },
    //     {label: 'Actual Size', accelerator: 'CommandOrControl+0', click: handlers.resetZoom},
    //     { label: 'Zoom In', accelerator: 'CommandOrControl+Plus', click: handlers.zoomIn },
    //     { label: 'Zoom Out', accelerator: 'CommandOrControl+-', click: handlers.zoomOut },
    //     { type: 'separator' },
    //     { role: 'togglefullscreen' },
    //   ],
    // },
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
