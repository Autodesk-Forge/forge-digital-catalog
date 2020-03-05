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

<script lang='ts'>
import { Component, Vue } from 'vue-property-decorator';
import config from '../../config';
import { validateSession } from '../../utils/utils';

@Component
export default class PublishLogs extends Vue {

    protected alert: boolean = false;
    protected alertMessage: string = '';
    protected descending: boolean = true;
    protected itemsPerPage: number = 2;
    protected headers: any = [{
      align: 'left',
      sortable: true,
      text: 'Start Date',
      value: 'startDate'
    }, {
      text: 'End Date',
      value: 'endDate'
    }, {
      text: 'Job Name',
      value: 'name'
    }, {
      text: 'Input Design Urn',
      value: 'designUrn'
    }, {
      text: 'Input Design Path',
      value: 'path'
    }, {
      text: 'Output Design Urn',
      value: 'svfUrn'
    }, {
      text: 'Status',
      value: 'status'
    }, {
      text: 'Submitted By',
      value: 'submittedBy'
    }];
    protected logs: string[] = [];
    protected page: number = 1;
    protected pageCount: number = 0;
    protected sortBy: string = 'startDate';

    beforeMount(): void {
      const loggedInSession = localStorage.getItem('loggedInSession');
      if (loggedInSession) {
        const retrievedSession = validateSession(loggedInSession);
        // detect if query param isAdminUserLoggedIn is true
        if (this.$route.query.isAdminUserLoggedIn || retrievedSession) {
            this.getPublisherLogs();
        }
      }
    }

    private async getPublisherLogs(): Promise<void> {
        try {
            const res = await this.$axios({
                method: 'GET',
                url: new URL('/api/admin/publish/logs', config.koahost).href
            });
            if (res.status === 200) {
                const logsInfo = res.data;
                this.logs = logsInfo.map((val: any) => {
                    return {
                      designUrn: val.job.input.designUrn,
                      endDate: val.endDate,
                      name: val.name,
                      path: val.job.input.path,
                      startDate: val.startDate,
                      status: val.status,
                      submittedBy: val.submittedBy,
                      svfUrn: val.job.output.svfUrn
                    };
                });
            }
        } catch (err) {
            this.alert = true;
            this.alertMessage = err;
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
