<template>
  <v-card>
    <v-sheet class="pa-3 primary lighten-2">
      <v-text-field
        v-model="search"
        label="Search Autodesk Models"
        dark
        flat
        solo-inverted
        hide-details
        clearable
        clear-icon="mdi-close-circle-outline"
      ></v-text-field>
      <v-checkbox v-model="caseSensitive" dark hide-details label="Case sensitive search"></v-checkbox>
    </v-sheet>
    <v-treeview
      :load-children="fetchModels"
      :items="items"
      :search="search"
      :filter="filter"
      :open.sync="open"
      class="grey lighten-5"
      transition
    >
      <template v-slot:prepend="{ item }">
        <input type="checkbox" v-bind:value="item.id" v-model="selectedModel">
        <v-icon v-if="!item.children" :color="active ? 'primary' : ''">icon-cloud-icon-blue</v-icon>
      </template>
    </v-treeview>
  </v-card>
</template>

<script>
import config from './../config'

export default {
  computed: {
    items() {
      return [
        {
          children: [
            {
              children: this.models,
              id: 2,
              name: this.$store.state.defaultHubProjectSetting.projectName,
              type: 'project'
            }
          ],
          id: 1,
          name: this.$store.state.defaultHubProjectSetting.hubName,
          type: 'hub'
        }
      ]
    },
    selected() {
      if (!this.active.length) return undefined
      const id = this.active[0]
      return this.models.find(item => item.id === id)
    },
    filter() {
      return this.caseSensitive
        ? (item, search, textKey) => item[textKey].indexOf(search) > -1
        : undefined
    }
  },
  data: () => ({
    active: [],
    alert: false,
    alertMessage: 'No error!',
    defaultHubProject: 'Undefined',
    isDefaultHubProjectDefined: false,
    open: [],
    models: [],
    selectedModel: [],
    search: null,
    caseSensitive: false
  }),
  methods: {
    async fetchItemVersions(item) {
      try {
        const res = await this.$axios({
          method: 'GET',
          url: new URL(
            `/api/fusion/projects/${
            this.$store.state.defaultHubProjectSetting.projectId
            }/items/${item.id}/versions`,
            config.koahost
          ).href
        })
        if (res.status === 200) {
          const data = res.data
          const children = data.map((val, i) => {
            return {
              id: val.id,
              name: `Version ${val.attributes.versionNumber}`,
              type: "version"
            }
          })
          item.children.push(...children)
        }
      } catch (err) {
        this.alert = true
        this.alertMessage = err
      }
    },
    async fetchFolderContents(item) {
      try {
        const res = await this.$axios({
          method: 'GET',
          url: new URL(
            `/api/fusion/projects/${
            this.$store.state.defaultHubProjectSetting.projectId
            }/folders/${item.id}/contents`,
            config.koahost
          ).href
        })
        if (res.status === 200) {
          const data = res.data.data
          const children = data.map((val, i) => {
            return {
              children: [],
              id: val.id,
              name: val.attributes.displayName,
              type:
                val.attributes.extension.type === "folders:autodesk.core:Folder"
                  ? "folder"
                  : "item"
            }
          })
          item.children.push(...children)
        }
      } catch (err) {
        this.alert = true
        this.alertMessage = err
      }
    },
    async fetchModels(item) {
      try {
        switch (item.type) {
          case "project":
            await this.fetchProjectFolders(item)
            break
          case "folder":
            await this.fetchFolderContents(item)
            break
          case "item":
            await this.fetchItemVersions(item)
            break
          default:
            this.$log.warn('Unknown item type.')
        }
      } catch (err) {
        this.alert = true
        this.alertMessage = err
      }
    },
    async fetchProjectFolders(item) {
      try {
        const res = await this.$axios({
          method: 'GET',
          url: new URL(
            `/api/fusion/hubs/${
            this.$store.state.defaultHubProjectSetting.hubId
            }/projects/${this.$store.state.defaultHubProjectSetting.projectId}`,
            config.koahost
          ).href
        })
        if (res.status === 200) {
          const resContent = await this.$axios({
            method: "GET",
            url: new URL(
              `api/fusion/projects/${
              this.$store.state.defaultHubProjectSetting.projectId
              }/folders/${
              res.data.data.relationships.rootFolder.data.id
              }/contents`,
              config.koahost
            ).href
          })
          if (resContent.status === 200) {
            const data = resContent.data.data
            const children = data.map((val, i) => {
              return {
                children: [],
                id: val.id,
                name: val.attributes.displayName,
                type: "folder"
              }
            })
            item.children.push(...children)
          }
        }
      } catch (err) {
        this.alert = true
        this.alertMessage = err
      }
    },
    async getDefaultHubProject() {
      try {
        this.$store.dispatch('setLoading', { defaultHubProjectSetting: true })
        const res = await this.$axios({
          method: 'GET',
          url: new URL(
            `/api/admin/settings/defaultHubProject/email/${
            this.$store.state.user.email
            }`,
            config.koahost
          ).href
        })
        if (res.status === 200 && res.data.length === 1) {
          this.isDefaultHubProjectDefined = true
          const defaultHubProjectSetting = res.data
          this.defaultHubProject = defaultHubProjectSetting.map(
            (val, i) => {
              return {
                hubId: val.hubId,
                hubName: val.hubName,
                projectId: val.projectId,
                projectName: val.projectName
              }
            }
          )
          this.$store.dispatch("setDefaultHubProjectSetting", res.data[0])
        }
      } catch (err) {
        this.alert = true
        this.alertMessage = err
      } finally {
        this.$store.dispatch("setLoading", { defaultHubProjectSetting: false })
      }
    },
    onChange() {
      this.selectedModel = [...this.active]
    }

  },
  watch: {
    selectedModel(models) {
      this.$store.dispatch('setSelectedModel', models)
    }
  }
}
</script>

