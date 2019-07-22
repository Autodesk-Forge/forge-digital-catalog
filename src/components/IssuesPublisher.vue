<template>
    <div>
        <v-toolbar>
            <v-toolbar-title>BIM360 Issues Publisher Console</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-toolbar-items class="hidden-sm-and-down">
                <v-btn flat @click="goToHome">Home</v-btn>
                <v-btn flat @click="goToAdminConsole">Administration</v-btn>
                <v-btn flat @click="goToPublisherConsole">Publisher Console</v-btn>
                <v-btn flat @click="goToHelp">Help</v-btn>
                <v-btn
                    flat
                    :icon="$vuetify.breakpoint.xs"
                    @click="login"
                    v-if="!this.$store.state.isAdminUserLoggedIn"
                >
                    <v-icon>person</v-icon>
                    <span class="hidden-md-and-down">Login</span>
                </v-btn>
                <v-btn
                    flat
                    :icon="$vuetify.breakpoint.xs"
                    @click="logout"
                    v-if="this.$store.state.isAdminUserLoggedIn"
                >
                    <v-icon>power_settings_new</v-icon>
                    <span class="hidden-md-and-down">Logout</span>
                </v-btn>
                <span v-if="this.$store.state.isAdminUserLoggedIn">
                    <v-progress-circular
                        indeterminate
                        color="primary"
                        v-if="this.$store.state.loading.userInfo"
                    ></v-progress-circular>
                    <v-avatar
                        :title="this.$store.state.user.fullName"
                        v-if="!this.$store.state.loading.userInfo"
                    >
                        <img :src="this.$store.state.user.picture">
                    </v-avatar>
                    <strong class="pl-1 hidden-sm-and-down" v-html="this.$store.state.user.fullName"></strong>
                </span>
            </v-toolbar-items>
        </v-toolbar>
        <v-content>
            <v-container>
                <v-layout text-xs-center row wrap>
                    <v-flex xs6>
                        <v-card height="100%">
                            <v-card-text>
                                <catalogTree/>
                            </v-card-text>
                        </v-card>
                    </v-flex>
                    <v-flex xs6>
                        <v-card>
                            <v-card-text>
                                <forgeViewer/>
                            </v-card-text>
                        </v-card>
                    </v-flex>
                </v-layout>
            </v-container>
        </v-content>
    </div>
</template>

<script>
import config from './../config'
import catalogTree from './CatalogTree.vue'
import forgeViewer from './ForgeViewer.vue'

export default {
    components: {
        catalogTree,
        forgeViewer
    },
    data: () => ({
        alert: false,
        alertMessage: ''
    }),
    methods: {
        goToAdminConsole() {
            this.$router.push({ path: '/admin' })
        },
        goToHelp() {
            window.open('https://mazerab.github.io/forge-digital-catalog/', '_blank')
        },
        goToHome() {
            this.$router.push({ path: '/' })
        },
        goToPublisherConsole() {
            this.$router.push({ path: '/publish' })
        },
        login() {
            window.location.href = new URL(
                '/api/forge/authenticate?state=publish',
                config.koahost
            ).href
        }
    }
}
</script>
