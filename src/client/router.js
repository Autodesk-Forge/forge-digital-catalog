import Vue from 'vue'
import Router from 'vue-router'

const Admin = () => import('./components/admin/Admin')
const DigitalCatalog = () => import('./components/DigitalCatalog')
const IssuesPublisher = () => import('./components/publish/IssuesPublisher')
const ManualsPublisher = () => import('./components/publish/ManualsPublisher')
const Publisher = () => import('./components/publish/Publisher')

Vue.use(Router)

export default new Router({
    mode: 'history',
    routes: [
        {
            component: Admin,
            name: 'admin',
            path: '/admin'
            
        },
        {
            component: IssuesPublisher,
            name: 'issues publisher',
            path: '/map/issues'
        },
        {
            component: ManualsPublisher,
            name: 'manuals publisher',
            path: '/map/manuals'
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
})