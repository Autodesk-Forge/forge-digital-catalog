<template>
  <v-card>
    <v-sheet class="pa-3 primary lighten-2">
      <v-text-field
        v-model="search"
        :label="$t('fusion.searchModel')"
        dark
        flat
        solo-inverted
        hide-details
        clearable
        clear-icon="mdi-close-circle-outline"
      />
      <v-row justify="space-between">
        <v-checkbox
          v-model="caseSensitive"
          dark
          hide-details
          label="Case sensitive search"
        />
      </v-row>
    </v-sheet>
    <v-treeview
      :load-children="fetchModels"
      :items="items"
      :search="search"
      :filter="filter"
      :open.sync="open"
      class="v-treeview-node__content"
      transition
    >
      <template v-slot:prepend="{ item }">
        <input
          v-model="selectedModel"
          type="checkbox"
          :value="item.id"
        >
        <v-icon
          v-if="!item.children"
          :color="active ? 'primary' : ''"
        >
          icon-cloud-icon-blue
        </v-icon>
      </template>
    </v-treeview>
  </v-card>
</template>

<script lang='ts'>
import { Component, Vue, Watch } from 'vue-property-decorator';
import { IItem } from '../../shared/tree';
import config from '../config';

@Component
export default class AutodeskTree extends Vue {

  protected active: string[] = [];
  protected alert: boolean = false;
  protected alertMessage: string = '';
  protected caseSensitive: boolean = false;
  protected defaultHubProject: string = '';
  protected isDefaultHubProjectDefined: boolean = false;
  protected models: IItem[] = [];
  protected open: string[] = [];
  protected search: string = '';
  protected selectedModel: string[] = [];

  get filter(): ((item: any, search: string, textKey: string) => boolean) | undefined {
    return this.caseSensitive
      ? ((item: any, search: string, textKey: string) => item[textKey].indexOf(search) > -1)
      : undefined;
  }

  get items(): [IItem] {
    return [{
      children: [{
        children: this.models,
        id: 2,
        name: this.$store.state.defaultHubProjectSetting.projectName,
        type: 'project'
      }],
      id: 1,
      name: this.$store.state.defaultHubProjectSetting.hubName,
      type: 'hub'
    }];
  }

  get selected(): IItem | undefined {
    if (!this.active.length) { return undefined; }
    const id = this.active[0];
    return this.models.find((item: any) => item.id === id);
  }

  @Watch('selectedModel')
  onSelectedModel(models: IItem[]) {
    this.$store.dispatch('setSelectedModel', models);
  }

  protected async fetchModels(item: IItem): Promise<void> {
    try {
      switch (item.type) {
        case 'project':
          await this.fetchProjectFolders(item);
          break;
        case 'folder':
          await this.fetchFolderContents(item);
          break;
        case 'item':
          await this.fetchItemVersions(item);
          break;
        default:
          this.$log.warn('Unknown item type.');
      }
    } catch (err) {
      this.alert = true;
      this.alertMessage = err;
    }
  }

  protected async getDefaultHubProject(): Promise<void> {
    try {
      this.$store.dispatch('setLoading', { defaultHubProjectSetting: true });
      if (this.$store.state.user.email) {
        const res = await this.$axios({
          method: 'GET',
          url: new URL(
            `/api/admin/settings/defaultHubProject/email/${this.$store.state.user.email}`,
            config.koahost
          ).href
        });
        if (res?.status === 200 && res?.data?.length === 1) {
          this.isDefaultHubProjectDefined = true;
          const defaultHubProjectSetting = res.data;
          this.defaultHubProject = defaultHubProjectSetting.map((val: any) => {
            return {
             hubId: val.hubId,
              hubName: val.hubName,
              projectId: val.projectId,
              projectName: val.projectName
            };
          });
          this.$store.dispatch('setDefaultHubProjectSetting', res.data[0]);
        }
      }
    } catch (err) {
      this.alert = true;
      this.alertMessage = err;
    } finally {
      this.$store.dispatch('setLoading', { defaultHubProjectSetting: false });
    }
  }

  protected onChange(): void {
    this.selectedModel = [...this.active];
  }

  private async fetchItemVersions(item: IItem): Promise<void> {
    try {
      const res = await this.$axios({
        method: 'GET',
        url: new URL(
          `/api/fusion/projects/${
          this.$store.state.defaultHubProjectSetting.projectId
          }/items/${item.id}/versions`,
          config.koahost
        ).href
      });
      if (res.status === 200) {
        const data = res.data.data;
        const children = data.map((val: any) => {
          return {
            id: val.id,
            name: `Version ${val.attributes.versionNumber}`,
            type: 'version'
          };
        });
        const subItems = item.children;
        if (subItems) {
          subItems.push(...children);
        }
      }
    } catch (err) {
      this.alert = true;
      this.alertMessage = err;
    }
  }

  private async fetchFolderContents(item: IItem): Promise<void> {
    try {
      const res = await this.$axios({
        method: 'GET',
        url: new URL(
          `/api/fusion/projects/${
          this.$store.state.defaultHubProjectSetting.projectId
          }/folders/${item.id}/contents`,
          config.koahost
        ).href
      });
      if (res.status === 200) {
        const data = res.data.data;
        const children = data.map((val: any) => {
          return {
            children: [],
            id: val.id,
            name: val.attributes.displayName,
            type:
              (
                val.attributes.extension.type === 'folders:autodesk.core:Folder'
                || val.attributes.extension.type ===  'folders:autodesk.bim360:Folder'
              )
                ? 'folder'
                : 'item'
          };
        });
        const subItems = item.children;
        if (subItems) {
          subItems.push(...children);
        }
      }
    } catch (err) {
      this.alert = true;
      this.alertMessage = err;
    }
  }

  private async fetchProjectFolders(item: IItem): Promise<void> {
    try {
      const res = await this.$axios({
        method: 'GET',
        url: new URL(
          `/api/fusion/hubs/${
          this.$store.state.defaultHubProjectSetting.hubId
          }/projects/${this.$store.state.defaultHubProjectSetting.projectId}`,
          config.koahost
        ).href
      });
      if (res.status === 200) {
        const resContent = await this.$axios({
          method: 'GET',
          url: new URL(
            `/api/fusion/hubs/${
            this.$store.state.defaultHubProjectSetting.hubId
            }/projects/${
            this.$store.state.defaultHubProjectSetting.projectId
            }/topFolders`,
            config.koahost
          ).href
        });
        if (resContent.status === 200) {
          const data = resContent.data.data;
          const children = data.map((val: any) => {
            return {
              children: [],
              id: val.id,
              name: val.attributes.displayName,
              type: 'folder'
            };
          });
          const subItems = item.children;
          if (subItems) {
            subItems.push(...children);
          }
        }
      }
    } catch (err) {
      this.alert = true;
      this.alertMessage = err;
    }
  }

}
</script>

