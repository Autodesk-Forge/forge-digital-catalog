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
      <v-container style="height:240px;max-height:300px;overflow-y:scroll">
        <v-list
          subheader
          two-line
        >
          <v-subheader>{{ $t('admin.featureToggles') }}</v-subheader>
          <v-list-item>
            <v-list-item-action>
              <v-checkbox v-model="animation" />
            </v-list-item-action>
            <v-list-item-content @click="animation = !animation">
              <v-list-item-title>{{ $t('admin.fusionAnimation') }}</v-list-item-title>
              <v-list-item-subtitle>{{ $t('admin.fusionAnimationSubTitle') }}</v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
          <v-list-item>
            <v-list-item-action>
              <v-checkbox v-model="arvr" />
            </v-list-item-action>
            <v-list-item-content @click="arvr = !arvr">
              <v-list-item-title>{{ $t('admin.arvrToolkit') }}</v-list-item-title>
              <v-list-item-subtitle>{{ $t('admin.arvrToolkitSubTitle') }}</v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
          <!-- <v-list-item>
            <v-list-item-action>
              <v-checkbox
                v-model="twin"
                disabled
              />
            </v-list-item-action>
            <v-list-item-content @click="twin = !twin">
              <v-list-item-title>Virtual Operations (Beta)</v-list-item-title>
              <v-list-item-subtitle>Enables digital twin features</v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item> -->
        </v-list>
      </v-container>
      <v-card-actions>
        <v-btn
          color="primary"
          @click="() => { saveFeatureToggles(animation, arvr, twin) }"
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
    twin: false,
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
          this.twin = res.data[0].featureToggles.digital_twin
          this.$store.dispatch('setFeatureToggles', {
            animation: res.data[0].featureToggles.fusion_animation,
            arvr: res.data[0].featureToggles.arvr_toolkit,
            twin: res.data[0].featureToggles.digital_twin
          })
        }
      } catch (err) {
        this.alert = true
        this.alertMessage = err
      }
    },
    async saveFeatureToggles(animation, arvr, twin) {
      try {
        this.$store.dispatch('setSaving', { featureToggleSetting: true })
        const res = await this.$axios({
          data: {
            animation,
            arvr,
            twin
          },
          method: 'POST',
          url: new URL('/api/admin/settings/features', config.koahost).href
        })
        if (res.status === 200) {
          this.$log.info('... saved feature toggles in database.')
          this.animation = res.data.featureToggles.fusion_animation
          this.arvr = res.data.featureToggles.arvr_toolkit
          this.twin = res.data.featureToggles.digital_twin
          this.$store.dispatch('setFeatureToggles', {
            animation: res.data.featureToggles.fusion_animation,
            arvr: res.data.featureToggles.arvr_toolkit,
            twin: res.data.featureToggles.digital_twin
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
