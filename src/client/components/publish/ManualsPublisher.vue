<template>
  <div>
    <v-toolbar>
      <v-toolbar-title>Manuals Publisher Console</v-toolbar-title>
      <v-spacer />
      <v-toolbar-items class="hidden-sm-and-down">
        <v-btn
          text
          @click="goToHome"
        >
          Home
        </v-btn>
        <v-btn
          text
          @click="goToAdminConsole"
        >
          Administration
        </v-btn>
        <v-btn
          text
          @click="goToPublisherConsole"
        >
          Publisher Console
        </v-btn>
        <v-btn
          text
          @click="goToHelp"
        >
          Help
        </v-btn>
        <v-btn
          v-if="!this.$store.state.isAdminUserLoggedIn"
          text
          :icon="$vuetify.breakpoint.xs"
          @click="login"
        >
          <v-icon>person</v-icon>
          <span class="hidden-md-and-down">Login</span>
        </v-btn>
        <v-btn
          v-if="this.$store.state.isAdminUserLoggedIn"
          text
          :icon="$vuetify.breakpoint.xs"
          @click="logout"
        >
          <v-icon>power_settings_new</v-icon>
          <span class="hidden-md-and-down">Logout</span>
        </v-btn>
        <span v-if="this.$store.state.isAdminUserLoggedIn">
          <v-progress-circular
            v-if="this.$store.state.loading.userInfo"
            indeterminate
            color="primary"
          />
          <v-avatar
            v-if="!this.$store.state.loading.userInfo"
            :title="this.$store.state.user.fullName"
          >
            <img :src="this.$store.state.user.picture">
          </v-avatar>
          <strong
            class="pl-1 hidden-sm-and-down"
            v-html="this.$store.state.user.fullName"
          />
        </span>
      </v-toolbar-items>
    </v-toolbar>
    <v-content>
      <v-container>
        <v-row class="text-center" >
          <v-col cols="6">
            <v-card height="100%">
              <v-card-text>
                <catalogTree />
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="6">
            <v-card>
              <v-card-text>
                <forgeViewer />
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-content>
  </div>
</template>

<script>
import config from './../../config'
import catalogTree from '../CatalogTree.vue'
import forgeViewer from '../viewer/ForgeViewer.vue'

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
            window.open(config.helphost, '_blank')
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
