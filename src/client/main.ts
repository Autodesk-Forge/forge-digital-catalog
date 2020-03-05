import '@mdi/font/css/materialdesignicons.css';
import 'material-design-icons-iconfont/dist/material-design-icons.css';
import Vue from 'vue';
import VueLogger from 'vuejs-logger';
import App from './App.vue';
import './plugins/axios';
import i18n from './plugins/i18n';
import vuetify from './plugins/vuetify';
import router from './router';
import store from './store';

const options = {
    isEnabled: true,
    logLevel : (process.env.NODE_ENV === 'production') ? 'error' : 'debug',
    separator: '|',
    showConsoleColors: true,
    showLogLevel : true,
    showMethodName : true,
    stringifyArguments : false
};

Vue.use(VueLogger, options);

Vue.config.errorHandler = (err, vm, info) => {
  (Vue as any).$log.error(`Error: ${err.toString()}\nInfo: ${info}`);
};
Vue.config.productionTip = false;
Vue.config.warnHandler = (msg, vm, trace) => {
  (Vue as any).$log.warn(`Warn: ${msg}\nTrace: ${trace}`);
};

new Vue({
  i18n,
  render: (h) => h(App),
  router,
  store,
  vuetify
}).$mount('#app');
