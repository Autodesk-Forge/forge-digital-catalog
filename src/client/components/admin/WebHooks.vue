<template>
  <v-col cols="12">
    <v-card v-if="this.$store.state.isAdminUserLoggedIn">
      <v-card-title primary-title>
        <div>
          <h3 class="headline mb-0">
            WebHooks
          </h3>
        </div>
      </v-card-title>
      <v-data-table
        :headers="headers"
        :items="webhooks"
        item-key="hookId"
        class="elevation-1"
      >
        <template v-slot:item.action="{ item }">
          <v-icon
            small
            @click="deleteWebHook(item.id)"
          >
            {{ $t('general.delete') }}
          </v-icon>
        </template>
      </v-data-table>
      <v-card-actions>
        <v-btn
          color="primary"
          @click="setWebHook"
        >
          {{ $t('admin.newWebHook') }}
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
    headers: [{
      text: 'Hook Id',
      align: 'left',
      sortable: false,
      value: 'id'
    }, {
      text: 'Tenant',
      value: 'tenant'
    }, {
      text: 'Event',
      value: 'event'
    }, {
      text: 'System',
      value: 'system'
    }, {
      text: 'Status',
      value: 'status'
    },
    {
      text: 'Action',
      value: 'action'
    }],
    webhooks: []
  }),
  beforeMount() {
    const retrievedSession = this.validateSession(localStorage.getItem('loggedInSession'))
    // detect if query param isAdminUserLoggedIn is true
    if (this.$route.query.isAdminUserLoggedIn || retrievedSession) {
      this.getWebHooks()
    }
  },
  methods: {
    async deleteWebHook(hookId) {
      try {
        this.$store.dispatch('setDeleting', { webHook: true })
        const res = await this.$axios({
          method: 'DELETE',
          url: new URL(`/api/admin/webhooks/${hookId}`, config.koahost).href
        })
        if (res.status === 200) {
          this.$log.info(`... deleted WebHookId: ${hookId}`)
        }
      } catch (err) {
        this.alert = true
        this.alertMessage = err
      } finally {
        this.$store.dispatch('setDeleting', { webHook: false })
        this.getWebHooks()
      }
    },
    async getWebHooks() {
      try {
        this.$store.dispatch('setLoading', { webHooksInfo: true })
        const res = await this.$axios({
          method: 'GET',
          url: new URL(`/api/admin/webhooks`, config.koahost).href
        })
        if (res.status === 200) {
          const webHooksInfo = res.data.data
          this.webhooks = webHooksInfo.map((val, i) => {
            return {
              id: val.hookId,
              tenant: val.tenant,
              event: val.event,
              system: val.system,
              status: val.status
            }
          })
        }
      } catch (err) {
        this.alert = true
        this.alertMessage = err
      } finally {
        this.$store.dispatch('setLoading', { webHooksInfo: false })
      }
    },
    async setWebHook() {
      try {
        this.$store.dispatch('setSaving', { newWebHook: true })
        const res = await this.$axios({
          method: 'POST',
          url: new URL(`/api/admin/webhooks`, config.koahost).href
        })
        if (res.status === 200) {
          this.$log.info('Saved new webhook')
        }
      } catch (err) {
        this.alert = true
        this.alertMessage = err
      } finally {
        this.$store.dispatch('setSaving', { newWebHook: false })
        this.getWebHooks()
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

