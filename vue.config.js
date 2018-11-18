const path = require('path');

const SRC_DIR = path.join(__dirname, 'src');

module.exports = {
  filenameHashing: false,
  pluginOptions: {
    electronBuilder: {
      mainProcessFile: './src/main/main.js',
      chainWebpackMainProcess (config) {
        config
          .module
          .rule('js')
          .test(/\.js$/u)
          .set('include', [SRC_DIR])
          .use('babel')
          .loader('babel-loader');
      },
      chainWebpackRendererProcess (config) {
        config
          .entry('app')
          .clear()
          .add('./src/renderer/index.js');
        config
          .module
          .rule('worker')
          .test(/\.worker\.js$/u)
          .set('include', [SRC_DIR])
          .post()
          .use('worker')
          .loader('worker-loader');
      },
      builderOptions: {
        appId: 'ws.sharpcla.venator.forest',
        productName: 'Forest',
        copyright: 'Copyright © 2018 Seth Blumberg',
        mac: {
          category: 'public.app-category.role-playing-games',
          target: 'dmg',
          icon: './icon.icns',
          minimumSystemVersion: '10.10.0',
          extendInfo: {
            NSRequiresAquaSystemAppearance: false,
          },
        },
      },
    },
  },
};
