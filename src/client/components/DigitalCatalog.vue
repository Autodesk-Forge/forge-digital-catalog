<template>
  <div>
    <v-toolbar>
      <v-toolbar-title>{{ $t('viewer.toolbarTitle') }}</v-toolbar-title>
      <v-spacer />
      <v-btn
        v-if="$mq === 'laptop' || $mq === 'desktop'"
        text
        @click="goToAdminConsole"
      >
        {{ $t('viewer.adminLogin') }}
      </v-btn>
      <v-btn
        text
        @click="goToHelp"
      >
        {{ $t('general.help') }}
      </v-btn>
    </v-toolbar>
    <v-alert
      v-model="alert"
      dismissible
      type="error"
    >
      {{ alertMessage }}
    </v-alert>
    <v-content v-if="$mq === 'mobile' || $mq === 'tablet'">
      <v-container fluid>
        <v-row class="text-center">
          <v-col
            class="mb-3"
            cols="12"
            lg="5"
          >
            <v-expansion-panels 
              v-model="panel"
              multiple
              popout
            >
              <v-expansion-panel>
                <template v-slot:header>
                  <div>Catalog</div>
                </template>
                <v-container style="height:auto">
                  <v-card height="100%">
                    <v-card-text>
                      <catalogTree />
                    </v-card-text>
                  </v-card>
                </v-container>
              </v-expansion-panel>
              <v-expansion-panel>
                <template v-slot:header>
                  <div>Forge Viewer</div>
                </template>
                <v-container style="max-height:900px;overflow-y:scroll">
                  <v-card height="100%">
                    <v-card-text>
                      <forgeViewer />
                    </v-card-text>
                  </v-card>
                </v-container>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-col>
        </v-row>
      </v-container>
    </v-content>
    <v-content v-if="$mq === 'laptop' || $mq === 'desktop'">
      <v-container fluid>
        <v-row class="text-center">
          <v-col cols="4">
            <v-container style="height:800px;max-height:900px;overflow-y:scroll">
              <v-card height="100%">
                <v-card-text>
                  <catalogTree />
                </v-card-text>
              </v-card>
            </v-container>
          </v-col>
          <v-col cols="8">
            <v-container style="height:800px;max-height:900px;overflow-y:scroll">
              <v-card>
                <v-card-text>
                  <forgeViewer />
                </v-card-text>
              </v-card>
            </v-container>
          </v-col>
        </v-row>
      </v-container>
    </v-content>
  </div>
</template>

<script>
import catalogTree from './CatalogTree.vue'
import forgeViewer from './viewer/ForgeViewer.vue'

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
          binary: res.data[0].featureToggles.gltf_binary_output,
          compress: res.data[0].featureToggles.gltf_draco_compression,
          dedupe: res.data[0].featureToggles.gltf_deduplication
        })
      }
    } catch (err) {
      this.alert = true
      this.alertMessage = err
    }
  },
  methods: {
    goToAdminConsole() {
      this.$router.push({ path: '/admin' })
    },
    goToHelp() {
      window.open(config.helphost, '_blank')
    }
  }
}
</script>
