import '@fortawesome/fontawesome-svg-core/styles.css';
import './assets/photon.css';

import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import icons from './icons';

Vue.config.productionTip = false;

Vue.component('FaI', icons);

new Vue({
  router,
  store,
  render: (h) => h(App),
  mounted () {
    this.$router.push('/');
  },
}).$mount('#app');
