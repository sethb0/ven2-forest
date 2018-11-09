module.exports = {
  filenameHashing: false,
  chainWebpack (config) {
    config.plugins.delete('preload');
    config.plugins.delete('prefetch');
  },
  pluginOptions: {
    electronBuilder: {
      mainProcessFile: './src/main/main.js',
      chainWebpackRendererProcess (config) {
        config.entry('app').clear().add('./src/renderer/index.js');
      },
      builderOptions: {
        appId: 'ws.sharpcla.venator.forest',
        productName: 'Venator Forest',
        copyright: 'Copyright © 2018 Seth Blumberg',
        mac: {
          category: 'public.app-category.role-playing-games',
          target: 'dmg',
          icon: './public/icon.icns',
        },
      },
    },
  },
};
