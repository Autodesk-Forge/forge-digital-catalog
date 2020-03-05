<template>
  <v-col cols="6">
    <v-card v-if="$store.state.isAdminUserLoggedIn">
      <v-card-title primary-title>
        <div>
          <h3 class="headline mb-0">
            {{ $t('admin.companyLogo') }}
          </h3>
        </div>
      </v-card-title>
      <v-card-actions>
        <v-container style="height:240px;max-height:300px;overflow-y:scroll">
          <ul>
            <input
              id="file"
              type="file"
              accept="image/*"
              @change="showFile()"
            >
            <v-img
              :src="companyLogo"
              width="150"
              alt="Thumb preview..."
            />
            <!--img src="{{companyLogo}}" width="150" alt="Thumb preview..."-->
          </ul>
        </v-container>
      </v-card-actions>
    </v-card>
  </v-col>
</template>

<script lang='ts'>
import { Component, Vue } from 'vue-property-decorator';
import config from '../../config';
import { validateSession } from '../../utils/utils';

@Component
export default class CompanyLogo extends Vue {

  protected alert: boolean = false;
  protected alertMessage: string = '';
  protected companyLogo: string = '';
  protected isWebAdminsDefined: boolean = false;

  beforeMount(): void {
    const loggedInSession = localStorage.getItem('loggedInSession');
    if (loggedInSession) {
      const retrievedSession = validateSession(loggedInSession);
      // detect if query param isAdminUserLoggedIn is true
      if (this.$route.query.isAdminUserLoggedIn || retrievedSession) {
        this.getCompanyLogo();
      }
    }
  }

  protected async showFile(): Promise<void> {
    try {
      if (document) {
        const inputTypeFile: HTMLInputElement | null = document.querySelector<HTMLInputElement>('input[type=file]');
        if (inputTypeFile && inputTypeFile.files) {
          const imageFile = inputTypeFile.files[0];
          const contentBuffer = await this.readFileAsync(imageFile);
          await this.saveCompanyLogo(contentBuffer);
        }
      }
    } catch (err) {
      this.alert = true;
      this.alertMessage = err;
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

  private readFileAsync(file: Blob): Promise<string | ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) { resolve(reader.result); }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private async saveCompanyLogo(imageSrc: string | ArrayBuffer): Promise<void> {
    try {
      this.$store.dispatch('setSaving', { companyLogo: true });
      const res = await this.$axios({
        data: {
          imageSrc,
          name: 'companyLogo'
        },
        headers: {
          'Content-Type': 'application/json'
        },
        method: 'POST',
        url: new URL('/api/admin/CompanyLogo', config.koahost).href
      });
      if (res.status === 200) {
        this.$store.dispatch('setCompanyLogo', res.data);
      }
    } catch (err) {
      this.alert = true;
      this.alertMessage = err;
    } finally {
      this.$store.dispatch('setSaving', { companyLogo: false });
      this.getCompanyLogo();
    }
  }

}
</script>