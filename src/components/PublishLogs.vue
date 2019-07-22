<template>
    <div>
        <v-alert v-model="alert" dismissible type="error">
            {{alertMessage}}
        </v-alert>
        <v-data-table
            class="elevation-1"
            :headers="headers"
            :items="logs"
            :pagination.sync="pagination"
        >
            <template v-slot:items="props">
                <td>{{ props.item.startDate }}</td>
                <td class="text-xs-right wrapText">{{ props.item.endDate }}</td>
                <td class="text-xs-right wrapText">{{ props.item.name }}</td>
                <td class="text-xs-right wrapText">{{ props.item.designUrn }}</td>
                <td class="text-xs-right wrapText">{{ props.item.path }}</td>
                <td class="text-xs-right wrapText">{{ props.item.svfUrn }}</td>
                <td class="text-xs-right wrapText">{{ props.item.status }}</td>
                <td class="text-xs-right wrapText">{{ props.item.submittedBy }}</td>
            </template>
        </v-data-table>
    </div>
</template>

<script>
import config from './../config'
export default {
    beforeMount () {
    const retrievedSession = this.validateSession(localStorage.getItem('loggedInSession'))
    // detect if query param isAdminUserLoggedIn is true
    if (this.$route.query.isAdminUserLoggedIn || retrievedSession) {
            this.getPublisherLogs()
        }
    },
    data: () => ({
        alert: false,
        alertMessage: '',
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
        pagination: {
            descending: true,
            rowsPerPage: 2,
            sortBy: 'startDate'
        }
    }),
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
    word-wrap: break-word 
}
</style>