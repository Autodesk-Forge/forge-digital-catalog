<template>
  <div>
    <v-toolbar>
      <v-toolbar-title>{{ $t('admin.toolbarTitle') }}</v-toolbar-title>
      <v-spacer />
      <v-toolbar-items class="hidden-sm-and-down">
        <v-btn
          text
          @click="goToHome"
        >
          {{ $t('admin.home') }}
        </v-btn>
        <v-btn
          text
          @click="goToPublisherConsole"
        >
          {{ $t('admin.publisher') }}
        </v-btn>
        <v-btn
          text
          @click="goToHelp"
        >
          {{ $t('general.help') }}
        </v-btn>
        <v-btn
          v-if="!this.$store.state.isAdminUserLoggedIn"
          text
          :icon="$vuetify.breakpoint.xs"
          @click="login"
        >
          <v-icon>person</v-icon>
          <span class="hidden-md-and-down">{{ $t('general.login') }}</span>
        </v-btn>
        <v-btn
          v-if="this.$store.state.isAdminUserLoggedIn"
          text
          :icon="$vuetify.breakpoint.xs"
          @click="logout"
        >
          <v-icon>power_settings_new</v-icon>
          <span class="hidden-md-and-down">{{ $t('general.logout') }}</span>
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
            <img
              :alt="this.$store.state.user.fullName"
              :src="this.$store.state.user.picture"
            >
          </v-avatar>
          <strong
            class="pl-1 hidden-sm-and-down"
            v-html="this.$store.state.user.fullName"
          />
        </span>
      </v-toolbar-items>
    </v-toolbar>
    <v-alert
      v-model="alert"
      dismissible
      type="error"
    >
      {{ alertMessage }}
    </v-alert>
    <div class="text-center">
      <v-btn
        v-if="!alert"
        color="primary"
        dark
        @click="alert=true"
      >
        {{ $t('admin.clearAlerts') }}
      </v-btn>
    </div>
    <v-content>
      <v-container>
        <v-row>
          <applicationName />
          <companyLogo />
        </v-row>
        <v-row>
          <defaultHubProject 
            v-bind:defaultHubProject="defaultHubProject"
            v-bind:isDefaultHubProjectDefined="isDefaultHubProjectDefined"
            @newDefaultHubProject="getDefaultHubProject"
            @resetDefaultHubProject="() => { isDefaultHubProjectDefined=false }"
          />
          <globalSettings />
          <supportedFileFormats />
        </v-row>
        <v-row>
          <webHooks />
        </v-row>
      </v-container>
    </v-content>
  </div>
</template>

<script>
import config from './../../config'

import applicationName from './ApplicationName.vue'
import companyLogo from './CompanyLogo.vue'
import defaultHubProject from './DefaultHubProject.vue'
import globalSettings from './GlobalSettings.vue'
import supportedFileFormats from './SupportedFileFormats'
import webHooks from './WebHooks'

export default {
  components: {
    applicationName,
    companyLogo,
    defaultHubProject,
    globalSettings,
    supportedFileFormats,
    webHooks
  },
  data: () => ({
    alert: false,
    alertMessage: '',
    defaultHubProject: [],
    isDefaultHubProjectDefined: false,
    isWebAdminsDefined: false,
    webAdmins: 'Undefined'
  }),
  async beforeMount() {
    const retrievedSession = this.validateSession(localStorage.getItem('loggedInSession'))
    // detect if query param isAdminUserLoggedIn is true
    if (this.$route.query.isAdminUserLoggedIn || retrievedSession) {
      this.$store.state.isAdminUserLoggedIn = true
      await this.setUserData()
      await this.getDefaultHubProject()
      await this.getSysAdmins()
    }
  },
  methods: {
    async getDefaultHubProject() {
      try {
        this.$store.dispatch('setLoading', { defaultHubProjectSetting: true })
        const res = await this.$axios({
          method: 'GET',
          url: new URL(`/api/admin/settings/defaultHubProject/email/${this.$store.state.user.email}`, config.koahost).href
        })
        if (res.status === 200 && res.data.length === 1) {
          this.isDefaultHubProjectDefined = true
          const defaultHubProjectSetting = res.data
          this.defaultHubProject = defaultHubProjectSetting.map((val, i) => {
            return {
              hub: val.hubName,
              project: val.projectName
            }
          })
          this.$store.dispatch('setDefaultHubProjectSetting', res.data[0])
        }
      } catch (err) {
        this.alert = true
        this.alertMessage = err
      } finally {
        this.$store.dispatch('setLoading', { defaultHubProjectSetting: false })
      }
    },
    async getSysAdmins() {
      try {
        this.$store.dispatch('setLoading', { webAdminsSetting: true })
        const res = await this.$axios({
          method: 'GET',
          url: new URL(`/api/admin/SysAdmins`, config.koahost).href
        })
        if (res.status === 200 && res.data.length === 1) {
          this.isWebAdminsDefined = true
          const webAdminsSetting = res.data
          this.webAdmins = webAdminsSetting[0].webAdmins
          this.$store.dispatch('setWebAdmins', this.webAdmins)
        }
      } catch (err) {
        this.alert = true
        this.alertMessage = err
      } finally {
        this.$store.dispatch('setLoading', { webAdminsSetting: false })
      }
    },
    goToHome() {
      this.$router.push({ path: '/' })
    },
    goToHelp() {
      window.open(config.helphost, '_blank')
    },
    goToPublisherConsole() {
      this.$router.push({ path: '/publish' })
    },
    login() {
      window.location.href = new URL('/api/forge/authenticate?state=admin', config.koahost).href
    },
    async logout() {
      try {
        localStorage.removeItem('loggedInSession')
        const res = await this.$axios.get(
          new URL('/api/forge/logout', config.koahost).href
        )
        if (res.status === 200) {
          this.$store.state.isAdminUserLoggedIn = false
          this.$store.dispatch('setUser', null)
          window.open(new URL('/api/forge/logoutaccount', config.koahost).href, '_blank')
          window.location.href = '/'
        }
      } catch (err) {
        this.alert = true
        this.alertMessage = err
      }
    },
    async setUserData() {
      try {
        this.$store.dispatch('setLoading', { userInfo: true })
        const res = await this.$axios({
          method: 'GET',
          url: new URL('/api/fusion/user/profile', config.koahost).href
        })
        if (res.status === 200) {
          this.$store.dispatch('setUserEmail', res.data.emailId)
          this.$store.dispatch('setUserFullName', `${res.data.firstName} ${res.data.lastName}`)
          this.$store.dispatch('setUserPicture', res.data.profileImages.sizeX40)
          this.$store.dispatch('setUser', {
            email: this.$store.state.user.email,
            fullName: this.$store.state.user.fullName,
            picture: this.$store.state.user.picture
          })
        }
      } catch (err) {
        this.alert = true
        this.alertMessage = err
      } finally {
        localStorage.setItem('loggedInSession', JSON.stringify(this.$store.state.user))
        this.$store.dispatch('setLoading', { userInfo: false })
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
