import 'material-design-icons-iconfont/dist/material-design-icons.css'
import '@mdi/font/css/materialdesignicons.css'

import Vue from 'vue'
import './plugins/axios'
import i18n from './plugins/i18n'
import vuetify from './plugins/vuetify'
import App from './App.vue'
import router from './router'
import store from './store'
import './registerServiceWorker'
import VueMq from 'vue-mq'
import VueLogger from 'vuejs-logger'

const options = {
    isEnabled: true,
    logLevel : (process.env.NODE_ENV === 'production') ? 'error' : 'debug',
    stringifyArguments : false,
    showLogLevel : true,
    showMethodName : true,
    separator: '|',
    showConsoleColors: true
}

Vue.use(VueLogger, options)

Vue.use(VueMq, {
  breakpoints: {
    mobile: 450,
    tablet: 900,
    laptop: 1250,
    desktop: Infinity
  }
})

Vue.config.errorHandler = (err, vm, info) => {
  Vue.$log.error(`Error: ${err.toString()}\nInfo: ${info}`)
}
Vue.config.productionTip = false
Vue.config.warnHandler = (msg, vm, trace) => {
  Vue.$log.warn(`Warn: ${msg}\nTrace: ${trace}`)
}

new Vue({
  i18n,
  router,
  store,
  vuetify,
  render: h => h(App)
}).$mount('#app')
