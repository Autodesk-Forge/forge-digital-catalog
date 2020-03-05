import Vue from 'vue';
import Router from 'vue-router';

import Admin from '../views/Admin.vue';
import DigitalCatalog from '../views/DigitalCatalog.vue';
import Login from '../views/Login.vue';
import Publisher from '../views/Publisher.vue';

Vue.use(Router);

export default new Router({
    mode: 'history',
    routes: [
        {
            component: Admin,
            name: 'admin',
            path: '/admin'
        },
        {
            component: Login,
            name: 'login',
            path: '/login'
        },
        {
            component: Publisher,
            name: 'publisher',
            path: '/publish'
        },
        {
            component: DigitalCatalog,
            name: 'view',
            path: '/'
        }
    ]
});
