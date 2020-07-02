<template>
  <div>
    <v-toolbar>
      <v-toolbar-title>{{ $t('viewer.toolbarTitle') }}</v-toolbar-title>
      <v-spacer />
      <v-btn
        v-if="this.$vuetify.breakpoint.name === 'md' || this.$vuetify.breakpoint.name === 'lg' || this.$vuetify.breakpoint.name === 'xl'"
        text
        @click="goToAdminConsole"
      >
        {{ $t('viewer.adminLogin') }}
      </v-btn>
      <v-btn
        text
        @click="goToHelp"
      >
        {{ $t('general.help') }}
      </v-btn>
    </v-toolbar>
    <v-alert
      v-model="alert"
      dismissible
      type="error"
    >
      {{ alertMessage }}
    </v-alert>
    <v-content v-if="this.$vuetify.breakpoint.name === 'xs' || this.$vuetify.breakpoint.name === 'sm'">
      <v-container fluid>
        <v-row class="text-center">
          <v-col
            class="mb-3"
            cols="12"
            lg="5"
          >
            <v-expansion-panels 
              v-model="panel"
              multiple
              popout
            >
              <v-expansion-panel>
                <template v-slot:header>
                  <div>Catalog</div>
                </template>
                <v-container style="height:auto">
                  <v-card height="100%">
                    <v-card-text>
                      <catalogTree />
                    </v-card-text>
                  </v-card>
                </v-container>
              </v-expansion-panel>
              <v-expansion-panel>
                <template v-slot:header>
                  <div>Forge Viewer</div>
                </template>
                <v-container style="max-height:900px;overflow-y:scroll">
                  <v-card height="100%">
                    <v-card-text>
                      <forgeViewer />
                    </v-card-text>
                  </v-card>
                </v-container>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-col>
        </v-row>
      </v-container>
    </v-content>
    <v-content v-if="this.$vuetify.breakpoint.name === 'md' || this.$vuetify.breakpoint.name === 'lg' || this.$vuetify.breakpoint.name === 'xl'">
      <v-container fluid>
        <v-row class="text-center">
          <v-col cols="4">
            <v-container style="height:800px;max-height:900px;overflow-y:scroll">
              <v-card height="100%">
                <v-card-text>
                  <catalogTree />
                </v-card-text>
              </v-card>
            </v-container>
          </v-col>
          <v-col cols="8">
            <v-container style="height:800px;max-height:900px;overflow-y:scroll">
              <v-card>
                <v-card-text>
                  <forgeViewer />
                </v-card-text>
              </v-card>
            </v-container>
          </v-col>
        </v-row>
      </v-container>
    </v-content>
  </div>
</template>

<script lang='ts'>
import { Component, Vue } from 'vue-property-decorator';
import catalogTree from '../components/CatalogTree.vue';
import forgeViewer from '../components/viewer/ForgeViewer.vue';
import config from './../config';

@Component({
  components: {
    catalogTree,
    forgeViewer
  }
})
export default class DigitalCatalog extends Vue {

  protected alert: boolean = false;
  protected alertMessage: string = '';
  protected panel: number[] = [1];

  async mounted(): Promise<void> {
    try {
      const url = new URL('/api/admin/settings/features', config.koahost);
      const res = await this.$axios({
        method: 'GET',
        url: url.toString()
      });
      if (res.status === 200) {
        this.$log.info('... retrieved feature toggles in database.');
        this.$store.dispatch('setFeatureToggles', {
          arvr_toolkit: res.data[0].featureToggles.arvr_toolkit,
          fusion_animation: res.data[0].featureToggles.fusion_animation,
          gltf_binary_output: res.data[0].featureToggles.gltf_binary_output,
          gltf_deduplication: res.data[0].featureToggles.gltf_deduplication,
          gltf_draco_compression: res.data[0].featureToggles.gltf_draco_compression,
          gltf_skip_unused_uvs: res.data[0].featureToggles.gltf_skip_unused_uvs
        });
      }
    } catch (err) {
      this.alert = true;
      this.alertMessage = err;
    }
  }

  protected goToAdminConsole(): void {
    this.$router.push({ path: '/admin' });
  }

  protected goToHelp(): void {
    window.open(config.helphost, '_blank');
  }

}
</script>
