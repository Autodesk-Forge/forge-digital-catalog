<template>
  <div>
    <v-toolbar>
      <v-toolbar-title>{{ $t('publish.toolbarTitle') }}</v-toolbar-title>
      <v-spacer />
      <v-toolbar-items class="hidden-sm-and-down">
        <v-btn
          text
          @click="goToHome"
        >
          {{ $t('admin.home') }}
        </v-btn>
        <v-btn
          text
          @click="goToAdminConsole"
        >
          {{ $t('publish.admin') }}
        </v-btn>
        <v-btn
          text
          @click="goToHelp"
        >
          {{ $t('general.help') }}
        </v-btn>
        <v-btn
          v-if="!$store.state.isAdminUserLoggedIn"
          text
          :icon="$vuetify.breakpoint.xs"
          @click="login"
        >
          <v-icon>person</v-icon>
          <span class="hidden-md-and-down">Login</span>
        </v-btn>
        <v-btn
          v-if="$store.state.isAdminUserLoggedIn"
          text
          :icon="$vuetify.breakpoint.xs"
          @click="logout"
        >
          <v-icon>power_settings_new</v-icon>
          <span class="hidden-md-and-down">Logout</span>
        </v-btn>
        <span v-if="$store.state.isAdminUserLoggedIn">
          <v-progress-circular
            v-if="$store.state.loading.userInfo"
            indeterminate
            color="primary"
          />
          <v-avatar
            v-if="!$store.state.loading.userInfo"
            :title="$store.state.user.fullName"
          >
            <img
              :src="$store.state.user.picture"
              alt="avatar"
            >
          </v-avatar>
          <strong class="pl-1 hidden-sm-and-down">
            {{ $store.state.user.fullName }}
          </strong>
        </span>
      </v-toolbar-items>
    </v-toolbar>
    <v-alert
      v-model="success"
      dismissible
      type="success"
    >
      {{ successMessage }}
    </v-alert>
    <v-alert
      v-model="alert"
      dismissible
      type="error"
    >
      {{ alertMessage }}
    </v-alert>
    <v-main>
      <v-container
        class="bg"
        fluid
      >
        <v-row 
          align="center"
        >
          <v-col cols="5">
            <v-container style="max-height:500px;overflow-y:scroll">
              <v-card v-if="$store.state.isAdminUserLoggedIn">
                <v-card-text>
                  <autodeskTree />
                </v-card-text>
              </v-card>
            </v-container>
          </v-col>
          <v-col cols="2">
            <v-card v-if="$store.state.isAdminUserLoggedIn">
              <v-card-actions>
                <v-col class="text-center">
                  <v-btn
                    v-if="active"
                    color="primary"
                    dark
                    rounded=""
                    @click="publish"
                  >
                    {{ $t('publish.publish') }}
                  </v-btn>
                  <v-btn
                    v-if="!active"
                    color="primary"
                    disabled
                    rounded=""
                    @click="publish"
                  >
                    {{ $t('publish.publish') }}
                  </v-btn>
                </v-col>
              </v-card-actions>
            </v-card>
          </v-col>
          <v-col cols="5">
            <v-container style="max-height:500px;overflow-y:scroll">
              <v-card v-if="$store.state.isAdminUserLoggedIn">
                <v-card-text>
                  <catalogTree />
                </v-card-text>
              </v-card>
            </v-container>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12">
            <v-progress-linear
              v-if="!active"
              :indeterminate="true" 
            />
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12">
            <v-card v-if="$store.state.isAdminUserLoggedIn">
              <v-card-title primary-title>
                <div>
                  <h3 class="headline mb-0">
                    {{ $t('publish.publisherLogs') }}
                  </h3>
                </div>
              </v-card-title>
              <v-card-text>
                <publishLogs :key="logsKey" />
              </v-card-text>
              <v-card-actions>
                <v-btn
                  text
                  @click="forceRerender"
                >
                  {{ $t('publish.refresh') }}
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
    <template>
      <v-dialog
        v-model="userNotAdminDialog"
        max-width="290"
      >
        <v-card>
          <v-card-title class="headline">
            {{ $t('publish.notAdmin') }}
          </v-card-title>
          <v-card-text>{{ alertMessage }}</v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn
              color="green darken-1"
              text="text"
              @click="redirectHome"
            >
              {{ $t('general.exit') }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </template>
  </div>
</template>

<script lang='ts'>
import { AxiosResponse } from 'axios';
import { Component, Vue } from 'vue-property-decorator';
import { IXRef } from '../../shared/publish';
import autodeskTree from '../components/AutodeskTree.vue';
import catalogTree from '../components/CatalogTree.vue';
import publishLogs from '../components/publish/PublishLogs.vue';
import config from '../config';
import { encodeBase64, validateSession } from '../utils/utils';

@Component({
  components: {
    autodeskTree,
    catalogTree,
    publishLogs
  }
})
export default class Publisher extends Vue {

  protected active: boolean = true;
  protected alert: boolean = false;
  protected alertMessage: string = '';
  protected defaultHubProject: string = '';
  protected isDefaultHubProjectDefined: boolean = false;
  protected isWebAdminsDefined: boolean = false;
  protected logsKey: number = 0;
  protected userNotAdminDialog: boolean = false;
  protected success: boolean = false;
  protected successMessage: string = '';
  protected webAdmins: string[] = [];
  protected webhooks: string[] = [];

  beforeMount(): void {
    let retrievedSession: boolean = false;
    if (localStorage) {
      const loggedInSession = localStorage.getItem('loggedInSession');
      if (loggedInSession) {
        retrievedSession = validateSession(loggedInSession);
      }
    }
    // detect if query param isAdminUserLoggedIn is true
    if (this.$route.query.isAdminUserLoggedIn || retrievedSession) {
      this.setUserData();
      this.$store.state.isAdminUserLoggedIn = true;
    }
  }

  protected forceRerender(): void {
    this.logsKey += 1;
  }

  protected goToAdminConsole(): void {
    this.$router.push({ path: '/admin' });
  }

  protected goToHelp(): void {
    window.open(config.helphost, '_blank');
  }

  protected goToHome(): void {
    this.$router.push({ path: '/' });
  }

  protected login(): void {
    window.location.href = new URL(
      '/api/forge/authenticate?state=publish',
      config.koahost
    ).href;
  }

  protected async logout(): Promise<void> {
    try {
      localStorage.removeItem('loggedInSession');
      const res = await this.$axios.get(
        new URL('/api/forge/logout', config.koahost).href
      );
      if (res.status === 200) {
        this.$store.state.isAdminUserLoggedIn = false;
        this.$store.dispatch('setUser', null);
        window.open(
          new URL('/api/forge/logoutaccount', config.koahost).href,
          '_blank'
        );
        window.location.href = '/';
      }
    } catch (err) {
      this.alert = true;
      this.alertMessage = err;
    }
  }

  protected async publish(): Promise<void> {
    try {
      await this.getWebHooks();
      if (this.webhooks.length === 0) {
        throw new Error('Publishing aborted. Please create new webHook in admin console first.');
      }
      if (
        Object.entries(this.$store.state.selectedModel).length === 0 &&
        this.$store.state.selectedModel.constructor === Object &&
        Object.entries(this.$store.state.selectedCatalog).length === 0 &&
        this.$store.state.selectedCatalog.constructor === Object
      ) {
        throw new Error('Please select a catalog folder and an item version.');
      }
      if (
        Object.entries(this.$store.state.selectedModel).length === 0 &&
        this.$store.state.selectedModel.constructor === Object
      ) {
        throw new Error('Please select an item version.');
      }
      if (
        Object.entries(this.$store.state.selectedCatalog).length === 0 &&
        this.$store.state.selectedCatalog.constructor === Object
      ) {
        throw new Error('Please select a catalog folder.');
      }
      if (!this.$store.state.selectedModel[0].includes('?version=')) {
        throw new Error('Please select a version to publish.');
      }
      if (this.$store.state.selectedCatalog[0] === 1) {
        throw new Error('You cannot publish a model to the Catalog root folder!');
      }
      this.active = false;
      await this.setCatalogItem();
      if (!this.alert) { await this.listObjectRefs(); }
      if (!this.alert) { await this.moveObject(); }
      if (!this.alert) { await this.setFusionRefsRootFilename(); } // workaround for bug with Fusion Designs with Refs
      if (!this.alert) { await this.translate(); }
      if (!this.alert) { await this.setPublishLogEntry(); }
      this.active = true;
    } catch (err) {
      this.$log.info(`publish err: ${JSON.stringify(err)}`);
      this.alert = true;
      this.alertMessage = err;
    }
  }

  protected redirectHome(): void {
    this.$router.push({ path: '/' });
  }

  private async findCatalogItemByName(name: string): Promise<AxiosResponse | void> {
    try {
      const res = await this.$axios({
        method: 'GET',
        url: new URL(
          `/api/catalog/file/name/${name}`,
          config.koahost
        ).href
      });
      if (res.status === 200) { return res; }
    } catch (err) {
      if (!err.message.includes('404')) { // no catalog item found is not an error
        this.alert = true;
        this.alertMessage = err;
      }
    }
  }

  private async getDefaultHubProject(): Promise<void> {
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
          this.defaultHubProject = defaultHubProjectSetting.map(
            (val: any) => {
              return {
                hubId: val.hubId,
                hubName: val.hubName,
                projectId: val.projectId,
                projectName: val.projectName
              };
            }
          );
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

  private async getSelectedCatalogInfo(): Promise<AxiosResponse | void> {
    try {
      const id = this.$store.state.selectedCatalog[0];
      const res = await this.$axios({
        method: 'GET',
        url: new URL(`/api/catalog/folder/id/${id}`, config.koahost).href
      });
      if (res.status === 200) {
        return res;
      }
    } catch (err) {
      this.alert = true;
      this.alertMessage = err;
    }
  }

  private async getSelectedModelInfo(): Promise<AxiosResponse | void> {
    try {
      const projectId = this.$store.state.defaultHubProjectSetting.projectId;
      let versionId = this.$store.state.selectedModel;
      if (versionId.constructor === Array && versionId.length > 0) { // potential hack due to select checkbox logic
        versionId = versionId.filter((version: any) => version.includes('fs.file'));
      }
      const res = await this.$axios({
        method: 'GET',
        url: new URL(`/api/fusion/projects/${projectId}/versions/${encodeURIComponent(versionId)}`, config.koahost).href
      });
      if (res.status === 200) { return res.data; }
    } catch (err) {
      this.alert = true;
      this.alertMessage = err;
    }
  }

  private async getSysAdmins(): Promise<void> {
    try {
      this.$store.dispatch('setLoading', { webAdminsSetting: true });
      const res = await this.$axios({
        method: 'GET',
        url: new URL(`/api/admin/sysadmins`, config.koahost).href
      });
      if (res.status === 200 && res.data.length === 1) {
        this.isWebAdminsDefined = true;
        const webAdminsSetting = res.data;
        this.webAdmins = webAdminsSetting[0].webAdmins;
        this.$store.dispatch('setWebAdmins', this.webAdmins);
      }
    } catch (err) {
      this.alert = true;
      this.alertMessage = err;
    } finally {
      this.$store.dispatch('setLoading', { webAdminsSetting: false });
    }
  }

  private async getWebHooks(): Promise<void> {
    try {
      this.$store.dispatch('setLoading', { webHooksInfo: true });
      const res = await this.$axios({
        method: 'GET',
        url: new URL(`/api/admin/webhooks`, config.koahost).href
      });
      if (res.status === 200) {
        const webHooksInfo = res.data.data;
        this.webhooks = webHooksInfo.map((val: any) => {
          return {
            event: val.event,
            id: val.hookId,
            status: val.status,
            system: val.system,
            tenant: val.tenant
          };
        });
      }
    } catch (err) {
      this.alert = true;
      this.alertMessage = err;
    } finally {
      this.$store.dispatch('setLoading', { webHooksInfo: false });
    }
  }

  private async listObjectRefs(): Promise<void> {
    try {
      this.$store.dispatch('setLoading', { modelRefs: true });
      const selectedModelInfo = await this.getSelectedModelInfo() as any;
      if (!!selectedModelInfo) {
        this.$store.dispatch('setRootFileName', selectedModelInfo.message.name);
        const fileType = selectedModelInfo.message.fileType;
        const projectId = this.$store.state.defaultHubProjectSetting.projectId;
        const versionId = this.$store.state.selectedModel;
        const res = await this.$axios({
          method: 'GET',
          url: new URL(
            `/api/fusion/projects/${projectId}/versions/${encodeURIComponent(versionId)}/refs`,
            config.koahost
          ).href
        });
        if (res.status === 200 && Array.isArray(res.data.included) && res.data.included.length > 0) {
          this.$log.info('... successfully retrieved the object references');
          const refsData = res.data.included;
          const refs = await this.setReferenceTree(refsData);
          if (!!refs) {
            if (fileType === 'iam') {
              this.$store.dispatch('setFileType', 'Inventor');
              const invTree = await this.setInventorChildReferences(projectId, refs, selectedModelInfo.message.name);
              if (Array.isArray(invTree) && invTree.length > 0) {
                this.$log.info('... storing Inventor reference tree in state');
                this.$store.dispatch('setModelRefs', invTree);
              }
            }
            if (fileType.includes('autodesk.fusion360:Design')) {
              this.$store.dispatch('setFileType', 'Fusion');
              const fusionRefs = refs.filter((ref: any) => {
                return ref.extension.includes('autodesk.fusion360') &&
                  ref.name !== selectedModelInfo.message.name;
              });
              if (Array.isArray(fusionRefs) && fusionRefs.length > 0) {
                this.$store.dispatch('setModelRefs', fusionRefs);
              }
            }
            if (fileType === 'nwd') {
              this.$store.dispatch('setFileType', 'NavisWorks');
            }
            if (fileType === 'sldasm') {
              this.$store.dispatch('setFileType', 'SolidWorks');
              const slwTree = await this.setSolidWorksChildReferences(projectId, refs, selectedModelInfo.message.name);
              if (Array.isArray(slwTree) && slwTree.length > 0) {
                this.$log.info('... storing SolidWorks reference tree in state');
                this.$store.dispatch('setModelRefs', slwTree);
              }
            }
          }
        }
      }
    } catch (err) {
      this.alert = true;
      this.alertMessage = err;
    } finally {
      this.$log.info(`... found ${this.$store.state.modelRefs.length} references`);
      this.$store.dispatch('setLoading', { modelRefs: false });
    }
  }

  private async moveObject(): Promise<void> {
    try {
      const selectedModelInfo = await this.getSelectedModelInfo() as any;
      if (!!selectedModelInfo) {
        const bucketKey = selectedModelInfo.message.storageLocation.split('/')[0].split(':')[3];
        const objectName = selectedModelInfo.message.storageLocation.split('/')[1];
        const res = await this.$axios({
          data: {
            fileType: (this.$store.state.fileType) ? this.$store.state.fileType : '',
            name: selectedModelInfo.message.name,
            projectId: this.$store.state.defaultHubProjectSetting.projectId,
            refs: (this.$store.state.modelRefs.length > 0) ? this.$store.state.modelRefs : [],
            storageLocation: selectedModelInfo.message.storageLocation,
            versionId: this.$store.state.selectedModel[0]
          },
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          method: 'POST',
          url: new URL(`/api/fusion/transfer/bucket/${bucketKey}/object/${objectName}`, config.koahost).href
        });
        if (res.status === 200 || res.status === 204) {
          this.$log.info('... successfully moved object to OSS bucket');
          const updateRes = await this.$axios({
            data: {
              srcDesignUrn: selectedModelInfo.message.storageLocation
            },
            method: 'PUT',
            url: new URL(`/api/catalog/file/oss/${res.data.objectId}`, config.koahost).href
          });
          if (updateRes.status === 200) {
            this.$store.dispatch('setDesignUrn', res.data.objectId);
          }
        }
      }
    } catch (err) {
      this.alert = true;
      this.alertMessage = err;
    }
  }

  private async setCatalogItem(): Promise<void> {
    try {
      this.$store.dispatch('setSaving', { newCatalogItem: true });
      const now = new Date();
      this.$store.dispatch('setStartDate', now);
      const selectedCatalogInfo = await this.getSelectedCatalogInfo() as any;
      if (!!selectedCatalogInfo) {
        this.$store.dispatch('setAutodeskPath', `${selectedCatalogInfo.data.path}${selectedCatalogInfo.data.name},`);
        const selectedModelInfo = await this.getSelectedModelInfo() as any;
        if (!!selectedModelInfo) {
          const existingCatalogItem = await this.findCatalogItemByName(selectedModelInfo.message.name) as any;
          if (!!existingCatalogItem && (selectedModelInfo.message.name === existingCatalogItem.name)) {
            throw new Error('Found existing catalog item with same name, aborting publishing job ...');
          }
          const res = await this.$axios({
            data: {
              isFile: true,
              isPublished: false,
              name: selectedModelInfo.message.name,
              ossDesignUrn: '',
              path: `${selectedCatalogInfo.data.path}${selectedCatalogInfo.data.name},`,
              size: selectedModelInfo.message.size,
              srcDesignUrn: selectedModelInfo.message.storageLocation,
              svfUrn: ''
            },
            method: 'POST',
            url: new URL('/api/catalog/file', config.koahost).href
          });
          if (res.status === 200) {
            this.$log.info('... new catalog item created');
          }
        }
      }
    } catch (err) {
      this.alert = true;
      this.alertMessage = err;
    } finally {
      this.$store.dispatch('setSaving', { newCatalogItem: false });
    }
  }

  private async setFusionRefsRootFilename(): Promise<void> {
    try {
      const selectedModelInfo = await this.getSelectedModelInfo() as any;
      if (selectedModelInfo && selectedModelInfo.message.fileType === 'versions:autodesk.fusion360:Design') {
        const res = await this.$axios({
          method: 'GET',
          url: new URL(
            `/api/catalog/file/storage/${encodeURIComponent(selectedModelInfo.message.storageLocation)}`,
            config.koahost).href
        });
        if (res.status === 200 && res.data.rootFilename) {
          this.$store.dispatch('setRootFileName', res.data.rootFilename);
          this.$log.info(`... updating Vuex store with new rootFilename value ${res.data.rootFilename}`);
        }
      }
    } catch (err) {
      this.alert = true;
      this.alertMessage = err;
    }
  }

  private async setInventorChildReferences(
    projectId: string,
    refs: IXRef[],
    selectedModelName: string
  ): Promise<IXRef[] | void> {
    try {
      const invRefs = refs.filter((ref: any) => {
        return ref.fileType.toLowerCase() === 'ipt' ||
          ( ref.fileType.toLowerCase() === 'iam' && ref.name !== selectedModelName );
      });
      const invTree = await Promise.all(invRefs.map(async (ref: any) => {
        if (ref.fileType.toLowerCase() === 'iam') {
          const res = await this.$axios({
            method: 'GET',
            url: new URL(
              `/api/fusion/projects/${projectId}/versions/${encodeURIComponent(ref.id)}/refs`,
              config.koahost
            ).href
          });
          if (res.status === 200 && Array.isArray(res.data.included) && res.data.included.length > 0) {
            const subRefsData = res.data.included;
            const subRefs = await this.setReferenceTree(subRefsData, ref.name);
            if (!!subRefs) {
              ref.children = subRefs; // Sets children on sub-assembly
              await this.setInventorChildReferences(projectId, subRefs, ref.name); // recurse through children
            }
          }
        }
        return Promise.resolve(ref);
      }));
      return invTree;
    } catch (err) {
      this.alert = true;
      this.alertMessage = err;
    }
  }

  private async setPublishLogEntry(): Promise<void> {
    try {
      const now = new Date();
      this.$store.dispatch('setEndDate', now);
      const payload = {
        endDate: this.$store.state.endDate,
        job: {
          input: {
            designUrn: this.$store.state.designUrn,
            path: this.$store.state.autodeskPath
          },
          output: {
            svfUrn: ''
          }
        },
        name: 'File Transfer & Translation',
        startDate: this.$store.state.startDate,
        submittedBy: this.$store.state.user.fullName
      };
      const res = await this.$axios({
        data: payload,
        method: 'POST',
        url: new URL('/api/admin/publish/logs', config.koahost).href
      });
      if (res.status === 200) {
        this.$log.info('.. new publish log entry created');
      }
    } catch (err) {
      this.alert = true;
      this.alertMessage = err;
    } finally {
      this.$store.dispatch('setDesignUrn', '');
      this.$store.dispatch('setStartDate', '');
      this.$store.dispatch('setEndDate', '');
      if (!this.alertMessage) {
        this.success = true;
        this.successMessage = 'Successfully published model to the catalog, translation still in progress.';
      }
    }
  }

  private setReferenceTree(refsRawData: string[], parentName?: string): IXRef[] | void {
    try {
      const refs = refsRawData.reduce((result: any[], val: any) => {
        if (val.relationships && val.relationships.storage && val.attributes.displayName !== parentName) {
          result.push({
            children: [],
            extension: (val.attributes.extension.type) ? val.attributes.extension.type : '',
            fileType: (val.attributes.fileType) ? val.attributes.fileType : '',
            id: (val.id) ? val.id : '',
            location: (val.relationships.storage.data.id) ? val.relationships.storage.data.id : '',
            name: (val.attributes.displayName) ? val.attributes.displayName : '',
            type: (val.type) ? val.type : ''
          });
        }
        return result;
      }, []);
      return refs;
    } catch (err) {
      this.alert = true;
      this.alertMessage = err;
    }
  }

  private async setSolidWorksChildReferences(
    projectId: string,
    refs: IXRef[],
    selectedModelName: string
  ): Promise<any[] | void> {
    try {
      const slwRefs = refs.filter((ref: any) => {
        return (ref.fileType.toLowerCase() === 'sldprt') ||
          ( (ref.fileType.toLowerCase() === 'sldasm') && ref.name !== selectedModelName );
      });
      const slwTree = await Promise.all(slwRefs.map(async (ref: any) => {
        if (ref.fileType.toLowerCase() === 'sldasm') {
          const res = await this.$axios({
            method: 'GET',
            url: new URL(
              `/api/fusion/projects/${projectId}/versions/${encodeURIComponent(ref.id)}/refs`,
              config.koahost
            ).href
          });
          if (res.status === 200 && Array.isArray(res.data.included) && res.data.included.length > 0) {
            const subRefsData = res.data.included;
            const subRefs = await this.setReferenceTree(subRefsData, ref.name);
            if (!!subRefs) {
              ref.children = subRefs; // Sets children on sub-assembly
              await this.setSolidWorksChildReferences(projectId, subRefs, ref.name); // recurse through children
            }
          }
        }
        return Promise.resolve(ref);
      }));
      return slwTree;
    } catch (err) {
      this.alert = true;
      this.alertMessage = err;
    }
  }

  private async setUserData(): Promise<void> {
    try {
      this.$store.dispatch('setLoading', { userInfo: true });
      const res = await this.$axios({
        method: 'GET',
        url: new URL('/api/fusion/user/profile', config.koahost).href
      });
      if (res.status === 200) {
        this.$store.dispatch('setUserEmail', res.data.emailId);
        this.$store.dispatch(
          'setUserFullName',
          `${res.data.firstName} ${res.data.lastName}`
        );
        this.$store.dispatch(
          'setUserPicture',
          res.data.profileImages.sizeX40
        );
        this.$store.dispatch('setUser', {
          email: this.$store.state.user.email,
          fullName: this.$store.state.user.fullName,
          picture: this.$store.state.user.picture
        });
        await this.getSysAdmins();
        if (this.$store.state.webAdmins.indexOf(this.$store.state.user.email) !== -1) {
          this.$store.state.isAdminUserLoggedIn = true;
        } else {
          // Add a modal dialog infoming that the user is not an admin
          this.alertMessage = `Please add ${this.$store.state.user.email} to the webAdmins setting for this site.`;
          this.userNotAdminDialog = true;
        }
      }
    } catch (err) {
      this.alert = true;
      this.alertMessage = err;
    } finally {
      localStorage.setItem('loggedInSession', JSON.stringify(this.$store.state.user));
      await this.getDefaultHubProject();
      this.$store.dispatch('setLoading', { userInfo: false });
    }
  }

  private async translate(): Promise<void> {
    try {
      const urn = encodeBase64(this.$store.state.designUrn);
      const extension = this.$store.state.designUrn.split('.').pop();
      const job: any = {
        input: {
          compressedUrn: false,
          urn
        },
        misc: { workflow: '' },
        output: {
          destination: { region: '' },
          formats: [{ type: 'svf', views: ['2d', '3d'] }]
        }
      }; // workflow and region will be set by the server controller
      if (extension === 'zip') {
        job.input.compressedUrn = true;
        job.input.rootFilename = this.$store.state.rootFileName;
      }
      const res = await this.$axios({
        data: job,
        method: 'POST',
        url: new URL('/api/admin/translate', config.koahost).href
      });
      if (res.status === 200 && res.data.result === 'success') {
        this.$log.info('... translation job submitted');
      }
    } catch (err) {
      this.alert = true;
      this.alertMessage = err;
    } finally {
      this.$store.dispatch('setFileType', null);
      this.$store.dispatch('setModelRefs', []);
    }
  }

}
</script>

