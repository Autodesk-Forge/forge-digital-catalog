<template>
  <v-col cols="4">
    <v-container style="max-height:300px;overflow-y:scroll">
      <v-card v-if="this.$store.state.isAdminUserLoggedIn">
        <v-card-title primary-title>
          <div>
            <h3 class="headline mb-0">
              {{ $t('admin.defaultHubProject') }}
            </h3>
            <div>{{ defaultHubProject[0].hub }} | {{ defaultHubProject[0].project }}</div>
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
        v-if="this.$store.state.isAdminUserLoggedIn && !isDefaultHubProjectDefined"
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

<script>
import config from './../../config'

export default {
  props: { 
    defaultHubProject: {
      default: null,
      type: Array
    },
    isDefaultHubProjectDefined: Boolean 
  },
  data: () => ({
    alert: false,
    alertMessage: '',
    hubs: [],
    projects: [],
    selectedHub: 'No selection',
    selectedProject: 'No selection',
    step: 1
  }),
  async beforeMount() {
    const retrievedSession = this.validateSession(localStorage.getItem('loggedInSession'))
    // detect if query param isAdminUserLoggedIn is true
    if (this.$route.query.isAdminUserLoggedIn || retrievedSession) {
      await this.getHubs()
    }
  },
  methods: {
    async getHubs() {
      try {
        this.$store.dispatch('setLoading', { hubsInfo: true })
        const res = await this.$axios({
          method: 'GET',
          url: new URL('/api/fusion/hubs', config.koahost).href
        })
        if (res.status === 200) {
          const hubsInfo = res.data.data
          this.hubs = hubsInfo.map((val, i) => {
            return {
              id: val.id,
              name: val.attributes.name
            }
          })
          this.$store.dispatch('setHubs', this.hubs)
        }
      } catch (err) {
        this.alert = true
        this.alertMessage = err
      } finally {
        this.$store.dispatch('setLoading', { hubsInfo: false })
      }
    },
    async getProjects(hubId) {
      try {
        this.$store.dispatch('setLoading', { projectsInfo: true })
        const res = await this.$axios({
          method: 'GET',
          url: new URL(`/api/fusion/hubs/${hubId}/projects`, config.koahost).href
        })
        if (res.status === 200) {
          const projectsInfo = res.data.data
          this.projects = projectsInfo.map((val, i) => {
            return {
              id: val.id,
              name: val.attributes.name
            }
          })
          this.$store.dispatch('setProjects', this.projects)
        }
      } catch (err) {
        this.alert = true
        this.alertMessage = err
      } finally {
        this.$store.dispatch('setLoading', { projectsInfo: false })
      }
    },
    async saveDefaultHubProject(hub, project) {
      try {
        this.$store.dispatch('setSaving', { defaultHubProjectSetting: true })
        const res = await this.$axios({
          data: {
            name: 'defaultHubProject',
            hubId: hub,
            hubName: this.hubs.filter(hubObj => {
              return hubObj.id === this.selectedHub
            })[0].name,
            projectId: project,
            projectName: this.projects.filter(projectObj => {
              return projectObj.id === this.selectedProject
            })[0].name,
            email: this.$store.state.user.email
          },
          headers: {
            'Content-Type': 'application/json'
          },
          method: 'POST',
          url: new URL('/api/admin/default/hub/project', config.koahost).href,

        })
        if (res.status === 200) {
          this.$store.dispatch('setDefaultHubProjectSetting', res.data)
        }
      } catch (err) {
        this.alert = true
        this.alertMessage = err
      } finally {
        this.$store.dispatch('setSaving', { defaultHubProjectSetting: false })
        this.$emit('newDefaultHubProject')
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
