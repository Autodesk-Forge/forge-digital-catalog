<template>
  <v-col cols="6">
    <v-card v-if="this.$store.state.isAdminUserLoggedIn">
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
            <!--img src="{{this.companyLogo}}" width="150" alt="Thumb preview..."-->
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
    companyLogo: ''
  }),
  beforeMount() {
    const retrievedSession = this.validateSession(localStorage.getItem('loggedInSession'))
    // detect if query param isAdminUserLoggedIn is true
    if (this.$route.query.isAdminUserLoggedIn || retrievedSession) {
      this.getCompanyLogo()
    }
  },
  methods: {
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
    },
    readFileAsync(file) {
      return new Promise((resolve, reject) => {
        let reader = new FileReader()
        reader.onload = () => {
          resolve(reader.result)
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
    },
    async saveCompanyLogo(imageSrc) {
      try {
        this.$store.dispatch('setSaving', { companyLogo: true })
        const res = await this.$axios({
          data: {
            name: 'companyLogo',
            imageSrc: imageSrc
          },
          headers: {
            'Content-Type': 'application/json'
          },
          method: 'POST',
          url: new URL('/api/admin/CompanyLogo', config.koahost).href,

        })
        if (res.status === 200) {
          this.$store.dispatch('setCompanyLogo', res.data)
        }
      } catch (err) {
        this.alert = true
        this.alertMessage = err
      } finally {
        this.$store.dispatch('setSaving', { companyLogo: false })
        this.getCompanyLogo()
      }
    },
    async showFile() {
      try {
        const imageFile = document.querySelector('input[type=file]').files[0]
        const contentBuffer = await this.readFileAsync(imageFile)
        await this.saveCompanyLogo(contentBuffer)
      } catch (err) {
        this.alert = true
        this.alertMessage = err
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