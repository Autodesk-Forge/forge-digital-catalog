<template>
  <div>
    <v-alert
      v-model="alert"
      dismissible
      type="error"
    >
      {{ alertMessage }}
    </v-alert>
    <div
      ref="forgeViewer"
      class="forgeViewer"
    />
    <animationPanel v-if="$store.state.featureToggles.fusion_animation" />
  </div>
</template>

<script lang='ts'>
import { AxiosResponse } from 'axios';
import { Component, Vue, Watch } from 'vue-property-decorator';
import config from '../../config';
import animationPanel from './AnimationPanel.vue';

@Component({
  components: { animationPanel }
})
export default class ForgeViewer extends Vue {

  protected alert: boolean = false;
  protected alertMessage: string = '';
  protected documentId: string = '';
  protected viewer!: Autodesk.Viewing.GuiViewer3D;
  protected viewerConfig: any = { extensions: ['Autodesk.Fusion360.Animation'] };

  async mounted(): Promise<void> {
    const vm = this;
    this.$root.$on('selectedCatalogItem', async function(this: ForgeViewer, e: any) {
      this.$log.info('... received selectedCatalogItem event');
      if (this.$store.state.selectedCatalog.length > 0) {
        const res = await this.$axios({
          method: 'GET',
          url: new URL(`/api/catalog/file/id/${this.$store.state.selectedCatalog[0]}`, config.koahost).href
        });
        if (res.status === 200 && res.data.svfUrn) {
          this.$store.dispatch('setShowCatalogTree', false);
          this.$root.$emit('clearStoryboards');
          this.$store.dispatch('setSvfUrn', res.data.svfUrn);
          const options = {
            env: 'AutodeskProduction',
            getAccessToken: async (onGetAccessToken: any) => {
              try {
                const res2 = await this.$axios({
                  method: 'GET',
                  url: new URL('/api/forge/authenticate/viewer', config.koahost).href + `?sb=${e[0]}`
                });
                if (res2.status === 200) {
                  vm.$store.dispatch('setViewerToken', res2.data.access_token);
                  onGetAccessToken(res2.data.access_token, 86400);
                }
              } catch (err) {
                this.alert = true;
                this.alertMessage = err;
              }
            },
            viewerCSSURL: config.viewerCSSURL,
            viewerScriptURL: config.viewerScriptURL
          };
          vm.initViewer(options, (await caches.keys()).includes(e[0]) && !(await caches.keys()).includes('Forge-Digital-Catalog'));
        }
      }
    });
    this.$root.$on('selectedStoryboard', function(this: ForgeViewer) {
      this.$log.info('... received selectedStoryboard event');
      if (this.$store.state.selectedStoryboard) {
        vm.clearModelInViewer();
        vm.loadModel(this.$store.state.selectedStoryboard.path);
      }
    });
  }

  @Watch('documentId')
  onModelChange() {
    this.loadDocument();
  }

  loadModel(path: string): void {
    try {
      this.viewer.loadModel(path, {}, this.onModelLoaded);
    } catch (err) {
      this.alert = true;
      this.alertMessage = err;
    }
  }

  protected clearModelInViewer(): void {
    try {
      if (this.viewer.model) {
        this.$log.info('... unloading current model from Autodesk Viewer');
        this.viewer.finish();
        const forgeViewer = this.$refs.forgeViewer as HTMLElement;
        this.viewer = new Autodesk.Viewing.GuiViewer3D(
          forgeViewer,
          { extensions: [ 'Autodesk.Fusion360.Animation' ] }
        );
        this.viewer.start();
      }
    } catch (err) {
      this.alert = true;
      this.alertMessage = err;
    }
  }

  protected clearViewer(): void {
    try {
      if (this.viewer) {
        this.viewer.finish();
      }
    } catch (err) {
      this.alert = true;
      this.alertMessage = err;
    }
  }

  protected initViewer(options: any, forceLoad: boolean) {
    return Promise.all([new Promise((resolve, reject) => {
      if (!forceLoad && typeof Autodesk === 'object' && Autodesk.Viewing) {
        resolve();
      } else {
        const link  = document.createElement('link');
        link.rel  = 'stylesheet';
        link.type = 'text/css';
        link.href = options.viewerCSSURL;
        link.onload = () => resolve();
        document.head.append(link);
      }
    }), new Promise((resolve, reject) => {
      if (!forceLoad && typeof Autodesk === 'object' && Autodesk.Viewing) {
        resolve();
      } else {
        const script = document.createElement('script');
        script.onload = () => resolve();
        script.src = options.viewerScriptURL;
        document.head.append(script);
      }
    })]).then(() => {
      Autodesk.Viewing.Initializer(options, this.onInitialized);
      this.$store.dispatch('setShowCatalogTree', true);
      return;
    });
  }

  protected onItemLoadFail(errorCode: string): void {
    this.$log.error(`onItemLoadFail() - errorCode: ${errorCode}`);
  }

  protected async onItemLoadSuccess(locViewer: any, viewables: any): Promise<void> {
    try {
      this.$log.info('... model loaded');
      await locViewer.loadExtension('Autodesk.Fusion360.Animation');
      this.$log.info('... Fusion360 Animation Extension loaded');
    } catch (err) {
      this.alert = true;
      this.alertMessage = err;
    }
  }

  private async getStoryBoardImageDataUri(doc: any, storyboard: string): Promise<AxiosResponse | void> {
    try {
      const urn = doc.myPath.replace('urn:', '');
      const res = await this.$axios({
        method: 'GET',
        url: new URL(`/api/fusion/thumbnail/${urn}`, config.koahost).href
      });
      if (res.status === 200) {
        return res.data;
      }
    } catch (err) {
      this.alert = true;
      this.alertMessage = err;
    }
  }

  private loadDocument(): void {
    try {
      this.documentId = `urn:${this.$store.state.svfUrn}`;
      Autodesk.Viewing.Document.load(
        this.documentId,
        this.onDocumentLoadSuccess,
        this.onDocumentLoadFailure
      );
    } catch (err) {
      this.alert = true;
      this.alertMessage = err;
    }
  }

  private onDocumentLoadFailure(viewerErrorCode: any): void {
    this.$log.error(`onDocumentLoadFailure() - errorCode: ${viewerErrorCode}`);
  }

  private async onDocumentLoadSuccess(doc: any): Promise<void> {
    try {
      await this.selectItem(doc);
    } catch (err) {
      this.alert = true;
      this.alertMessage = err;
    }
  }

  private onInitialized(): void {
    try {
      this.clearViewer();
      const forgeViewer = this.$refs.forgeViewer as HTMLElement;
      this.viewer = new Autodesk.Viewing.GuiViewer3D(forgeViewer, { extensions: [ 'Autodesk.Fusion360.Animation' ] });
      this.viewer.start();
      this.loadDocument();
    } catch (err) {
      this.alert = true;
      this.alertMessage = err;
    }
  }

  private onModelLoaded(model: any): void {
    this.viewer.restoreState({
      viewport: {
        isOrthographic: false,
        projection: 'perspective'
      }
    });
    return;
  }

  private async selectItem(doc: any): Promise<void> {
    try {
      await this.viewer.loadDocumentNode(doc, doc.getRoot().getDefaultGeometry());
      this.setAnimations(doc);
    } catch (err) {
      this.alert = true;
      this.alertMessage = err;
    }
  }

  private async setAnimations(doc: any): Promise<any | undefined> {
    try {
      this.$store.dispatch('setSaving', { animations: true });
      const subFolders = doc.getRoot().search({
        role: 'animation',
        type: 'folder'
      }, true);
      let animations: string[] = [];
      if (subFolders.length) {
        const children = subFolders[0].children;
        animations = await Promise.all(children.map(async (id: any, i: number) => {
          const subModel = children[i];
          const imageDataUri = await this.getStoryBoardImageDataUri(doc, subModel);
          const viewablePath = doc.getViewablePath(subModel);
          return Promise.resolve({
            imageDataUri,
            name: id.name(),
            path: viewablePath
          });
        }));
      }
      this.$store.dispatch('setAnimations', animations);
    } catch (err) {
      this.alert = true;
      this.alertMessage = err;
    } finally {
      this.$store.dispatch('setSaving', { animations: false });
      this.$root.$emit('setAnimations', this.$store.state.animations);
    }
  }
}
</script>

<style>
.forgeViewer {
  position: relative;
  width: 100%;
  height: 600px;
  margin: 0;
  background-color: #dcdcdc;
}
</style>
