<template>
  <v-col cols="4">
    <v-card v-if="$store.state.isAdminUserLoggedIn">
      <v-card-title primary-title>
        <div>
          <h3 class="headline mb-0">
            {{ $t('admin.supportedFormats') }}
          </h3>
        </div>
      </v-card-title>
      <v-container style="height:440px;max-height:400px;overflow-y:scroll">
        <v-list-item>
          <v-list-item-action>
            <v-checkbox v-model="formats.dwg" />
          </v-list-item-action>
          <v-list-item-content @click="formats.dwg = !formats.dwg">
            <v-list-item-title>AutoCAD</v-list-item-title>
            <v-list-item-subtitle>.DWG</v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
        <v-list-item>
          <v-list-item-action>
            <v-checkbox v-model="formats.creo" />
          </v-list-item-action>
          <v-list-item-content @click="formats.creo = !formats.creo">
            <v-list-item-title>PTC Creo</v-list-item-title>
            <v-list-item-subtitle>.ASM, .DRW, .PRT</v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
        <v-list-item>
          <v-list-item-action>
            <v-checkbox v-model="formats.fbx" />
          </v-list-item-action>
          <v-list-item-content @click="formats.fbx = !formats.fbx">
            <v-list-item-title>3ds Max, Maya, MotionBuilder, Mudbox</v-list-item-title>
            <v-list-item-subtitle>.FBX</v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
        <v-list-item>
          <v-list-item-action>
            <v-checkbox v-model="formats.fusion" />
          </v-list-item-action>
          <v-list-item-content @click="formats.fusion = !formats.fusion">
            <v-list-item-title>Fusion</v-list-item-title>
            <v-list-item-subtitle>.F2D, .F3D</v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
        <v-list-item>
          <v-list-item-action>
            <v-checkbox v-model="formats.inventor" />
          </v-list-item-action>
          <v-list-item-content @click="formats.inventor = !formats.inventor">
            <v-list-item-title>Inventor</v-list-item-title>
            <v-list-item-subtitle>.IAM, .IDW, .IPT</v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
        <v-list-item>
          <v-list-item-action>
            <v-checkbox v-model="formats.navisworks" />
          </v-list-item-action>
          <v-list-item-content @click="formats.navisworks = !formats.navisworks">
            <v-list-item-title>NavisWorks</v-list-item-title>
            <v-list-item-subtitle>.NWD</v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
        <v-list-item>
          <v-list-item-action>
            <v-checkbox v-model="formats.obj" />
          </v-list-item-action>
          <v-list-item-content @click="formats.obj = !formats.obj">
            <v-list-item-title>WaveFront</v-list-item-title>
            <v-list-item-subtitle>.OBJ</v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
        <v-list-item>
          <v-list-item-action>
            <v-checkbox v-model="formats.solidworks" />
          </v-list-item-action>
          <v-list-item-content @click="formats.solidworks = !formats.solidworks">
            <v-list-item-title>SolidWorks</v-list-item-title>
            <v-list-item-subtitle>.SLDASM .SLDDRW .SLDPRT</v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
        <v-list-item>
          <v-list-item-action>
            <v-checkbox v-model="formats.step" />
          </v-list-item-action>
          <v-list-item-content @click="formats.step = !formats.step">
            <v-list-item-title>STEP</v-list-item-title>
            <v-list-item-subtitle>.STP .STEP</v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
      </v-container>
      <v-card-actions>
        <v-btn
          color="primary"
          @click="() => { 
            saveFileFormats(
              formats.creo,
              formats.dwg,
              formats.fbx,
              formats.fusion,
              formats.inventor,
              formats.navisworks,
              formats.obj,
              formats.solidworks,
              formats.step
            )}"
        >
          {{ $t('general.save') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-col>
</template>

<script lang='ts'>
import { Component, Vue } from 'vue-property-decorator';
import config from '../../config';
import { validateSession } from '../../utils/utils';

@Component
export default class SupportedFileFormats extends Vue {

  protected alert: boolean = false;
  protected alertMessage: string = '';
  protected formats: any = {
    creo: false,
    dwg: false,
    fbx: false,
    fusion: false,
    inventor: false,
    navisworks: false,
    obj: false,
    solidworks: false,
    step: false
  };

  beforeMount(): void {
    const loggedInSession = localStorage.getItem('loggedInSession');
    if (loggedInSession) {
      const retrievedSession = validateSession(loggedInSession);
      // detect if query param isAdminUserLoggedIn is true
      if (this.$route.query.isAdminUserLoggedIn || retrievedSession) {
        this.getFileFormats();
      }
    }
  }

  protected async saveFileFormats(
    creo: boolean,
    dwg: boolean,
    fbx: boolean,
    fusion: boolean,
    inventor: boolean,
    navisworks: boolean,
    obj: boolean,
    solidworks: boolean,
    step: boolean
  ): Promise<void> {
    try {
      this.$store.dispatch('setSaving', { fileFormatSetting: true });
      const res = await this.$axios({
        data: {
          creo,
          dwg,
          fbx,
          fusion,
          inventor,
          navisworks,
          obj,
          solidworks,
          step
        },
        method: 'POST',
        url: new URL('/api/admin/settings/fileformats', config.koahost).href
      });
      if (res.status === 200) {
        this.$log.info('... saved file formats toggles in database.');
        this.formats.creo = res.data.fileFormatToggles.creo;
        this.formats.dwg = res.data.fileFormatToggles.dwg;
        this.formats.fbx = res.data.fileFormatToggles.fbx;
        this.formats.fusion = res.data.fileFormatToggles.fusion;
        this.formats.inventor = res.data.fileFormatToggles.inventor;
        this.formats.navisworks = res.data.fileFormatToggles.navisworks;
        this.formats.obj = res.data.fileFormatToggles.obj;
        this.formats.solidworks = res.data.fileFormatToggles.solidworks;
        this.formats.step = res.data.fileFormatToggles.step;
        this.$store.dispatch('setFileFormatToggles', {
          creo: res.data.fileFormatToggles.creo,
          dwg: res.data.fileFormatToggles.dwg,
          fbx: res.data.fileFormatToggles.fbx,
          fusion: res.data.fileFormatToggles.fusion,
          inventor: res.data.fileFormatToggles.inventor,
          navisworks: res.data.fileFormatToggles.navisworks,
          obj: res.data.fileFormatToggles.obj,
          solidworks: res.data.fileFormatToggles.solidworks,
          step: res.data.fileFormatToggles.step
        });
      }
    } catch (err) {
      this.alert = true;
      this.alertMessage = err;
    } finally {
      this.$store.dispatch('setSaving', { fileFormatSetting: false });
    }
  }

  private async getFileFormats(): Promise<void> {
    try {
      const res = await this.$axios({
        method: 'GET',
        url: new URL('/api/admin/settings/fileformats', config.koahost).href
      });
      if (res.status === 200 && res.data.length > 0) {
        this.$log.info('... retrieved file format toggles in database.');
        this.formats.creo = res.data[0].fileFormatToggles.creo;
        this.formats.dwg = res.data[0].fileFormatToggles.dwg;
        this.formats.fbx = res.data[0].fileFormatToggles.fbx;
        this.formats.fusion = res.data[0].fileFormatToggles.fusion;
        this.formats.inventor = res.data[0].fileFormatToggles.inventor;
        this.formats.navisworks = res.data[0].fileFormatToggles.navisworks;
        this.formats.obj = res.data[0].fileFormatToggles.obj;
        this.formats.solidworks = res.data[0].fileFormatToggles.solidworks;
        this.formats.step = res.data[0].fileFormatToggles.step;
        this.$store.dispatch('setFileFormatToggles', {
          creo: res.data[0].fileFormatToggles.creo,
          dwg: res.data[0].fileFormatToggles.dwg,
          fbx: res.data[0].fileFormatToggles.fbx,
          fusion: res.data[0].fileFormatToggles.fusion,
          inventor: res.data[0].fileFormatToggles.inventor,
          navisworks: res.data[0].fileFormatToggles.navisworks,
          obj: res.data[0].fileFormatToggles.obj,
          solidworks: res.data[0].fileFormatToggles.solidworks,
          step: res.data[0].fileFormatToggles.step
        });
      }
    } catch (err) {
      this.alert = true;
      this.alertMessage = err;
    }
  }

}
</script>
