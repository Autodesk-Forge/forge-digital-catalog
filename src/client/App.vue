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

<script lang='ts'>
import { Component, Vue } from 'vue-property-decorator';
import config from './config';

@Component
export default class App extends Vue {

  protected isWebAdminsDefined: boolean = false;
  protected alert: boolean = false;
  protected alertMessage: string = '';
  protected applicationName: string = '';
  protected companyLogo: string = '';

  beforeMount(): void {
    this.getCompanyLogo();
    this.getApplicationName();
  }

  private async getApplicationName(): Promise<void> {
    try {
      this.$store.dispatch('setLoading', { applicationName: true });
      const res = await this.$axios({
        method: 'GET',
        url: new URL(`/api/admin/ApplicationName`, config.koahost).href
      });
      if (res.status === 200 && res.data.length === 1) {
        this.isWebAdminsDefined = true;
        const applicationNameSetting = res.data;
        this.applicationName = applicationNameSetting[0].appName;
        this.$store.dispatch('setApplicationName', this.applicationName);
      }
    } catch (err) {
      this.alert = true;
      this.alertMessage = err;
    } finally {
      this.$store.dispatch('setLoading', { applicationName: false });
    }
  }

  private async getCompanyLogo(): Promise<void> {
    try {
      this.$store.dispatch('setLoading', { companyLogo: true });
      const res = await this.$axios({
        method: 'GET',
        url: new URL(`/api/admin/CompanyLogo`, config.koahost).href
      });
      if (res.status === 200 && res.data.length === 1) {
        this.isWebAdminsDefined = true;
        const companyLogoSetting = res.data;
        this.companyLogo = companyLogoSetting[0].imageSrc;
        this.$store.dispatch('setCompanyLogo', this.companyLogo);
      }
    } catch (err) {
      this.alert = true;
      this.alertMessage = err;
    } finally {
      this.$store.dispatch('setLoading', { companyLogo: false });
    }
  }

}
</script>

<style lang="scss">
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
