<template>
  <div>
    <v-toolbar>
      <v-toolbar-title>Viewer Console</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn flat @click="goToAdminConsole" v-if="$mq === 'laptop' || $mq === 'desktop'">Admin Login</v-btn>
      <v-btn flat @click="goToHelp">Help</v-btn>
    </v-toolbar>
    <v-alert v-model="alert" dismissible type="error">{{alertMessage}}</v-alert>
    <v-content v-if="$mq === 'mobile' || $mq === 'tablet'">
      <v-container fluid>
        <v-layout text-xs-center row wrap>
          <v-flex xs12 lg5 mb-3>
            <v-expansion-panel 
              v-model="panel"
              expand
              popout
            >
              <v-expansion-panel-content>
                <template v-slot:header>
                  <div>Catalog</div>
                </template>
                <v-container style="height:auto">
                  <v-card height="100%">
                    <v-card-text>
                      <catalogTree/>
                    </v-card-text>
                  </v-card>
                </v-container>
              </v-expansion-panel-content>
              <v-expansion-panel-content>
                <template v-slot:header>
                  <div>Forge Viewer</div>
                </template>
                <v-container style="max-height:900px;overflow-y:scroll">
                  <v-card height="100%">
                    <v-card-text>
                      <forgeViewer/>
                    </v-card-text>
                  </v-card>
                </v-container>
              </v-expansion-panel-content>
            </v-expansion-panel>
          </v-flex>
        </v-layout>
      </v-container>
    </v-content>
    <v-content v-if="$mq === 'laptop' || $mq === 'desktop'">
      <v-container fluid>
        <v-layout text-xs-center row wrap>
          <v-flex xs4>
            <v-container style="height:800px;max-height:900px;overflow-y:scroll">
              <v-card height="100%">
                <v-card-text>
                  <catalogTree/>
                </v-card-text>
              </v-card>
              </v-container>
          </v-flex>
          <v-flex xs8>
            <v-container style="height:800px;max-height:900px;overflow-y:scroll">
              <v-card>
                <v-card-text>
                  <forgeViewer/>
                </v-card-text>
              </v-card>
            </v-container>
          </v-flex>
        </v-layout>
      </v-container>
    </v-content>
  </div>
</template>

<script>
import catalogTree from './CatalogTree.vue'
import forgeViewer from './ForgeViewer.vue'

import config from './../config'

export default {
  components: {
    catalogTree,
    forgeViewer
  },
  data: () => ({
    alert: false,
    alertMessage: '',
    panel: [false, true]
  }),
  methods: {
    goToAdminConsole() {
      this.$router.push({ path: '/admin' })
    },
    goToHelp() {
      window.open('https://mazerab.github.io/forge-digital-catalog/', '_blank')
    }
  },
  mounted: async function () {
    try {
      const res = await this.$axios({
        method: 'GET',
        url: new URL('/api/admin/settings/features', config.koahost)
      })
      if (res.status === 200) {
        this.$log.info('... retrieved feature toggles in database.')
        this.$store.dispatch('setFeatureToggles', {
          animation: res.data[0].featureToggles.fusion_animation,
          arvrtoolkit: res.data[0].featureToggles.arvr_toolkit,
          twin: res.data[0].featureToggles.digital_twin
        })
      }
    } catch (err) {
      this.alert = true
      this.alertMessage = err
    }
  }
}
</script>
