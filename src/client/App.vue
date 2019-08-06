<template>
  <v-app id="digital-catalog">
    <v-app-bar app>
      <v-toolbar-title class="headline text-uppercase">
        <span>
          <div class="title">{{ applicationName }}</div>
        </span>
      </v-toolbar-title>
      <v-row
        align="center"
        justify="center"
      >
        <v-img
          :src="companyLogo"
          class="my-3"
          position="center center"
          max-width="150"
          max-height="50" 
        />
      </v-row>
      <v-btn
        text
        href="https://forge.autodesk.com"
        target="_blank"
        rel="noreferrer"
      >
        <span class="mr-2">Autodesk Forge</span>
      </v-btn>
    </v-app-bar>
    <v-content>
      <router-view />
    </v-content>
  </v-app>
</template>

<script>
import config from './config'

export default {
  name: 'DigitalCatalogApp',
  data: () => ({
    applicationName: '',
    companyLogo: ''
  }),
  beforeMount() {
    this.getCompanyLogo();
    this.getApplicationName();
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
    async getCompanyLogo() {
      try {
        this.$store.dispatch('setLoading', { companyLogo: true })
        const res = await this.$axios({
          method: 'GET',
          url: new URL(`/api/admin/CompanyLogo`, config.koahost).href
        })
        if (res.status === 200 && res.data.length === 1) {
          this.isWebAdminsDefined = true
          const companyLogoSetting = res.data
          this.companyLogo = companyLogoSetting[0].imageSrc

          this.$store.dispatch('setCompanyLogo', this.companyLogo)
        }
      } catch (err) {
        this.alert = true
        this.alertMessage = err
      } finally {
        this.$store.dispatch('setLoading', { companyLogo: false })
      }
    }
  }
}
</script>
