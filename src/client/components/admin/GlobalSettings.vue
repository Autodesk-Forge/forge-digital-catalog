<template>
  <v-col cols="4">
    <v-card v-if="this.$store.state.isAdminUserLoggedIn">
      <v-card-title primary-title>
        <div>
          <h3 class="headline mb-0">
            {{ $t('admin.globalSettings') }}
          </h3>
        </div>
      </v-card-title>
      <v-container style="height:440px;max-height:400px;overflow-y:scroll">
        <v-list
          subheader
          two-line
        >
          <v-subheader>{{ $t('admin.featureToggles') }}</v-subheader>
          <v-list-item>
            <v-expansion-panels
              v-model="panelvalue"
              multiple
            >
              <v-expansion-panel :key="0">
                <v-expansion-panel-header>
                  <v-checkbox v-model="animation" />
                  <v-list-item-title>{{ $t('admin.fusionAnimation') }}</v-list-item-title>
                </v-expansion-panel-header>
                <v-expansion-panel-content>
                  <v-list-item-subtitle>{{ $t('admin.fusionAnimationSubTitle') }}</v-list-item-subtitle>
                </v-expansion-panel-content>
              </v-expansion-panel>

              <v-expansion-panel key="1">
                <v-expansion-panel-header>
                  <v-checkbox v-model="arvr" />
                  {{ $t('admin.arvrToolkit') }}
                </v-expansion-panel-header>
                <v-expansion-panel-content>
                  <v-list-item-subtitle>{{ $t('admin.arvrToolkitSubTitle') }}</v-list-item-subtitle>
                  <v-list>
                    <v-list-item v-if="arvr">
                      <v-list-item-action>
                        <v-checkbox v-model="binary" />
                      </v-list-item-action>
                      <v-list-item-content @click="binary = !binary">
                        <v-list-item-title>{{ $t('admin.binary') }}</v-list-item-title>
                        <v-list-item-subtitle>{{ $t('admin.binarySubTitle') }}</v-list-item-subtitle>
                      </v-list-item-content>
                    </v-list-item>
                    <v-list-item v-if="arvr">
                      <v-list-item-action>
                        <v-checkbox v-model="dedupe" />
                      </v-list-item-action>
                      <v-list-item-content @click="dedupe = !dedupe">
                        <v-list-item-title>{{ $t('admin.dedupe') }}</v-list-item-title>
                        <v-list-item-subtitle>{{ $t('admin.dedupeSubTitle') }}</v-list-item-subtitle>
                      </v-list-item-content>
                    </v-list-item>
                    <v-list-item v-if="arvr">
                      <v-list-item-action>
                        <v-checkbox v-model="compress" />
                      </v-list-item-action>
                      <v-list-item-content @click="compress = !compress">
                        <v-list-item-title>{{ $t('admin.dracoCompression') }}</v-list-item-title>
                        <v-list-item-subtitle>{{ $t('admin.dracoCompressionSubTitle') }}</v-list-item-subtitle>
                      </v-list-item-content>
                    </v-list-item>
                    <v-list-item v-if="arvr">
                      <v-list-item-action>
                        <v-checkbox v-model="uvs" />
                      </v-list-item-action>
                      <v-list-item-content @click="uvs = !uvs">
                        <v-list-item-title>{{ $t('admin.skipUnusedUvs') }}</v-list-item-title>
                        <v-list-item-subtitle>{{ $t('admin.skipUnusedUvsSubTitle') }}</v-list-item-subtitle>
                      </v-list-item-content>
                    </v-list-item>
                  </v-list>
                </v-expansion-panel-content>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-list-item>
        </v-list>
      </v-container>
      <v-card-actions>
        <v-btn
          color="primary"
          @click="() => { saveFeatureToggles(animation, arvr, binary, compress, dedupe, uvs) }"
        >
          {{ $t('general.save') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-col>
</template>

<script>
import config from './../../config'

export default {
  data: () => ({
    alert: false,
    alertMessage: '',
    animation: false,
    arvr: false,
    binary: false,
    compress: false,
    dedupe: false,
    panelvalue: [],
    uvs: false
  }),
  beforeMount() {
    const retrievedSession = this.validateSession(localStorage.getItem('loggedInSession'))
    // detect if query param isAdminUserLoggedIn is true
    if (this.$route.query.isAdminUserLoggedIn || retrievedSession) {
      this.getFeatureToggles()
    }
  },
  methods: {
    async getFeatureToggles() {
      try {
        const res = await this.$axios({
          method: 'GET',
          url: new URL('/api/admin/settings/features', config.koahost).href
        })
        if (res.status === 200 && res.data.length > 0) {
          this.$log.info('... retrieved feature toggles in database.')
          this.animation = res.data[0].featureToggles.fusion_animation
          this.arvr = res.data[0].featureToggles.arvr_toolkit
          this.binary = res.data[0].featureToggles.binary
          this.compress = res.data[0].featureToggles.gltf_draco_compression
          this.dedupe = res.data[0].featureToggles.gltf_deduplication
          this.uvs = res.data[0].featureToggles.gltf_skip_unused_uvs
          this.$store.dispatch('setFeatureToggles', {
            animation: res.data[0].featureToggles.fusion_animation,
            arvr: res.data[0].featureToggles.arvr_toolkit,
            binary: res.data[0].featureToggles.gltf_binary_output,
            compress: res.data[0].featureToggles.gltf_draco_compression,
            dedupe: res.data[0].featureToggles.gltf_deduplication,
            uvs: res.data[0].featureToggles.gltf_skip_unused_uvs
          })
          if (this.arvr) {
            this.panelvalue = [1]
          }
        }
      } catch (err) {
        this.alert = true
        this.alertMessage = err
      }
    },
    async saveFeatureToggles(animation, arvr, binary, compress, dedupe, uvs) {
      try {
        this.$store.dispatch('setSaving', { featureToggleSetting: true })
        const res = await this.$axios({
          data: {
            animation,
            arvr,
            binary,
            compress,
            dedupe,
            uvs
          },
          method: 'POST',
          url: new URL('/api/admin/settings/features', config.koahost).href
        })
        if (res.status === 200) {
          this.$log.info('... saved feature toggles in database.')
          this.animation = res.data.featureToggles.fusion_animation
          this.arvr = res.data.featureToggles.arvr_toolkit
          this.binary = res.data.featureToggles.gltf_binary_output
          this.compress = res.data.featureToggles.gltf_draco_compression
          this.dedupe = res.data.featureToggles.gltf_deduplication
          this.uvs = res.data.featureToggles.gltf_skip_unused_uvs
          this.$store.dispatch('setFeatureToggles', {
            animation: res.data.featureToggles.fusion_animation,
            arvr: res.data.featureToggles.arvr_toolkit,
            binary: res.data.featureToggles.gltf_binary_output,
            compress: res.data.featureToggles.gltf_draco_compression,
            dedupe: res.data.featureToggles.gltf_deduplication,
            uvs: res.data.featureToggles.gltf_skip_unused_uvs
          })
        }
      } catch (err) {
        this.alert = true
        this.alertMessage = err
      } finally {
        this.$store.dispatch('setSaving', { featureToggleSetting: false })
      }
    },
    validateSession(storageVariable) {
      try {
        const userObject = JSON.parse(storageVariable)
        if (userObject) {
          const retrievedEmail = String(userObject.email)
          if (retrievedEmail.indexOf('@') > -1) {
            return true
          }
        }
        return false
      } catch (err) {
        this.alert = true
        this.alertMessage = err
      }
    }
  }
}
</script>
