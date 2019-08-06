<template>
  <div>
    <v-alert
      v-model="alert"
      dismissible
      type="error"
    >
      {{ alertMessage }}
    </v-alert>
    <v-data-table
      class="elevation-1"
      :headers="headers"
      :items="logs"
      :items-per-page="itemsPerPage"
      :page.sync="page"
      :sort-by.sync="sortBy"
      :sort-desc.sync="descending"
      hide-default-footer
      @page-count="pageCount = $event"
    >
      <v-pagination v-model="page" />
      <template v-slot:item.svfUrn="{ item }">
        <v-col class="wrapText">
          {{ item.svfUrn }}
        </v-col>
      </template>
      <template v-slot:item.designUrn="{ item }">
        <v-col class="wrapText">
          {{ item.designUrn }}
        </v-col>
      </template>
    </v-data-table>
    <div class="text-center pt-2">
      <v-pagination
        v-model="page"
        :length="pageCount"
      />
    </div>
  </div>
</template>

<script>
import config from './../config'
export default {
    data: () => ({
        alert: false,
        alertMessage: '',
        descending: true,
        itemsPerPage: 2,
        headers: [
            {
                text: 'Start Date',
                align: 'left',
                sortable: true,
                value: 'startDate'
            },{
                text: 'End Date',
                value: 'endDate'
            },{
                text: 'Job Name',
                value: 'name'
            },{
                text: 'Input Design Urn',
                value: 'designUrn'
            },{
                text: 'Input Design Path',
                value: 'path'
            },{
                text: 'Output Design Urn',
                value: 'svfUrn'
            },{
                text: 'Status',
                value: 'status'
            },{
                text: 'Submitted By',
                value: 'submittedBy'
            }
        ],
        logs: [],
        page: 1,
        pageCount: 0,
        sortBy: "startDate"
    }),
    beforeMount () {
    const retrievedSession = this.validateSession(localStorage.getItem('loggedInSession'))
    // detect if query param isAdminUserLoggedIn is true
    if (this.$route.query.isAdminUserLoggedIn || retrievedSession) {
            this.getPublisherLogs()
        }
    },
    methods: {
        async getPublisherLogs () {
            try {
                const res = await this.$axios({
                    method: 'GET',
                    url: new URL('/api/admin/publish/logs', config.koahost).href
                })
                if (res.status === 200) {
                    const logsInfo = res.data
                    this.logs = logsInfo.map((val, i) => {
                        return {
                            startDate: val.startDate,
                            endDate: val.endDate,
                            name: val.name,
                            designUrn: val.job.input.designUrn,
                            path: val.job.input.path,
                            svfUrn: val.job.output.svfUrn,
                            status: val.status,
                            submittedBy: val.submittedBy
                        }
                    })
                }
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

<style>
.wrapText {
    max-width: 100px;
    max-height: 50px;
    overflow-y: scroll;
    word-wrap: break-word
}
</style>
