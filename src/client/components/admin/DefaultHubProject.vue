<template>
  <v-col cols="4">
    <v-container style="max-height:300px;overflow-y:scroll">
      <v-card v-if="$store.state.isAdminUserLoggedIn">
        <v-card-title primary-title>
          <div>
            <h3 class="headline mb-0">
              {{ $t('admin.defaultHubProject') }}
            </h3>
            <div v-if="isDefaultHubProjectDefined">
              {{ defaultHubProject[0].hub }} | {{ defaultHubProject[0].project }}
            </div>
          </div>
        </v-card-title>
        <v-card-actions>
          <v-btn
            v-if="!alert"
            color="primary"
            dark
            @click="() => { this.$emit('resetDefaultHubProject') }"
          >
            {{ $t('general.reset') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-container>
    <v-container style="height:240px;max-height:300px;overflow-y:scroll">
      <v-stepper
        v-if="$store.state.isAdminUserLoggedIn && !isDefaultHubProjectDefined"
        v-model="step"
        vertical
      >
        <v-stepper-step
          :complete="step > 1"
          step="1"
        >
          {{ $t('admin.selectDefaultHub') }}
          <small>{{ selectedHub }}</small>
        </v-stepper-step>
        <v-stepper-content step="1">
          <v-card>
            <v-radio-group
              v-for="hub in hubs"
              :key="hub.id"
              v-model="selectedHub"
            >
              <v-radio
                :label="hub.name"
                :value="hub.id"
                :checked="hub.id"
              />
            </v-radio-group>
          </v-card>
          <v-btn
            color="primary"
            @click="() => { step=2; getProjects(selectedHub) }"
          >
            {{ $t('general.continue') }}
          </v-btn>
          <v-btn text>
            {{ $t('general.cancel') }}
          </v-btn>
        </v-stepper-content>
        <v-stepper-step
          :complete="step > 2"
          step="2"
        >
          {{ $t('admin.selectDefaultProject') }}
          <small>{{ selectedProject }}</small>
        </v-stepper-step>
        <v-stepper-content step="2">
          <v-card>
            <v-radio-group
              v-for="project in projects"
              :key="project.id"
              v-model="selectedProject"
            >
              <v-radio
                :label="project.name"
                :value="project.id"
                :checked="project.id"
              />
            </v-radio-group>
            <v-card-actions>
              <v-btn
                color="primary"
                @click="() => { step=3; saveDefaultHubProject(selectedHub, selectedProject) }"
              >
                {{ $t('general.save') }}
              </v-btn>
              <v-btn text>
                {{ $t('general.cancel') }}
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-stepper-content>
      </v-stepper>
    </v-container>
  </v-col>
</template>

<script lang='ts'>
import { Component, Prop, Vue } from 'vue-property-decorator';
import config from '../../config';
import { validateSession } from '../../utils/utils';

@Component
export default class DefaultHubProject extends Vue {

  @Prop(Boolean) isDefaultHubProjectDefined!: boolean;
  @Prop({ default: [] }) defaultHubProject!: string[];

  protected alert: boolean = false;
  protected alertMessage: string = '';
  protected hubs: string[] = [];
  protected projects: string[] = [];
  protected selectedHub: string = '';
  protected selectedProject: string = '';
  protected step: number = 1;

  async beforeMount(): Promise<void> {
    const loggedInSession = localStorage.getItem('loggedInSession');
    if (loggedInSession) {
      const retrievedSession = validateSession(loggedInSession);
      // detect if query param isAdminUserLoggedIn is true
      if (this.$route.query.isAdminUserLoggedIn || retrievedSession) {
        await this.getHubs();
      }
    }
  }

  async saveDefaultHubProject(hub: string, project: string): Promise<void> {
    try {
      this.$store.dispatch('setSaving', { defaultHubProjectSetting: true });
      const hubs: string[] = this.hubs.filter(
        (hubObj: any) => {
          return hubObj.id === this.selectedHub;
        }
      );
      const hubItem: any = hubs[0];
      const hubName: string = hubItem.name;
      const projects: string[] = this.projects.filter(
        (projectObj: any) => {
            return projectObj.id === this.selectedProject;
        }
      );
      const projectItem: any = projects[0];
      const projectName: string = projectItem.name;
      const res = await this.$axios({
        data: {
          email: this.$store.state.user.email,
          hubId: hub,
          hubName,
          name: 'defaultHubProject',
          projectId: project,
          projectName
        },
        headers: {
          'Content-Type': 'application/json'
        },
        method: 'POST',
        url: new URL('/api/admin/default/hub/project', config.koahost).href
      });
      if (res.status === 200) {
        this.$store.dispatch('setDefaultHubProjectSetting', res.data);
      }
    } catch (err) {
      this.alert = true;
      this.alertMessage = err;
    } finally {
      this.$store.dispatch('setSaving', { defaultHubProjectSetting: false });
      this.$emit('newDefaultHubProject');
    }
  }

  protected async getProjects(hubId: string): Promise<void> {
    try {
      this.$store.dispatch('setLoading', { projectsInfo: true });
      const res = await this.$axios({
        method: 'GET',
        url: new URL(`/api/fusion/hubs/${hubId}/projects`, config.koahost).href
      });
      if (res.status === 200) {
        const projectsInfo = res.data.data;
        this.projects = projectsInfo.map((val: any) => {
          return {
            id: val.id,
            name: val.attributes.name
          };
        });
        this.$store.dispatch('setProjects', this.projects);
      }
    } catch (err) {
      this.alert = true;
      this.alertMessage = err;
    } finally {
      this.$store.dispatch('setLoading', { projectsInfo: false });
    }
  }

  private async getHubs(): Promise<void> {
    try {
      this.$store.dispatch('setLoading', { hubsInfo: true });
      const res = await this.$axios({
        method: 'GET',
        url: new URL('/api/fusion/hubs', config.koahost).href
      });
      if (res.status === 200) {
        const hubsInfo = res.data.data;
        this.hubs = hubsInfo.map((val: any) => {
          return {
            id: val.id,
            name: val.attributes.name
          };
        });
        this.$store.dispatch('setHubs', this.hubs);
      }
    } catch (err) {
      this.alert = true;
      this.alertMessage = err;
    } finally {
      this.$store.dispatch('setLoading', { hubsInfo: false });
    }
  }

}
</script>
