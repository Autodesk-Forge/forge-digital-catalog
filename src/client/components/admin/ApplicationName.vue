<template>
  <v-col cols="6">
    <v-card v-if="this.$store.state.isAdminUserLoggedIn">
      <v-card-title primary-title>
        <div>
          <h3 class="headline mb-0">
            {{ $t('admin.appName') }}
          </h3>
        </div>
      </v-card-title>
      <v-card-actions>
        <v-container style="height:240px;max-height:300px;overflow-y:scroll">
          <ul>
            <v-text-field
              v-model="applicationName"
              label="Application Name"
            />
            <v-btn
              color="primary"
              @click="() => { saveApplicationName(applicationName) }"
            >
              {{ $t('general.save') }}
            </v-btn>
          </ul>
        </v-container>
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
    applicationName: ''
  }),
  beforeMount() {
    const retrievedSession = this.validateSession(localStorage.getItem('loggedInSession'))
    // detect if query param isAdminUserLoggedIn is true
    if (this.$route.query.isAdminUserLoggedIn || retrievedSession) {
      this.getApplicationName()
    }
  },
  methods: {
    async getApplicationName() {
      try {
        this.$store.dispatch('setLoading', { applicationName: true })
        const res = await this.$axios({
          method: 'GET',
          url: new URL(`/api/admin/ApplicationName`, config.koahost).href
        })
        if (res.status === 200 && res.data.length === 1) {
          this.isWebAdminsDefined = true
          const applicationNameSetting = res.data
          this.applicationName = applicationNameSetting[0].appName
          this.$store.dispatch('setApplicationName', this.applicationName)
        }
      } catch (err) {
        this.alert = true
        this.alertMessage = err
      } finally {
        this.$store.dispatch('setLoading', { applicationName: false })
      }
    },
    async saveApplicationName(providedName) {
      try {
        this.$store.dispatch('setSaving', { applicationName: true })
        const res = await this.$axios({
          data: {
            name: 'applicationName',
            value: providedName
          },
          headers: {
            'Content-Type': 'application/json'
          },
          method: 'POST',
          url: new URL('/api/admin/ApplicationName', config.koahost).href
        })
        if (res.status === 200) {
          this.$store.dispatch('setApplicationName', res.data)
        }
      } catch (err) {
        this.alert = true
        this.alertMessage = err
      } finally {
        this.$store.dispatch('setSaving', { applicationName: false })
        this.getApplicationName()
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
