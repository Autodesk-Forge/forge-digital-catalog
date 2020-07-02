<template>
  <v-col cols="4">
    <v-card v-if="$store.state.isAdminUserLoggedIn">
      <v-card-title primary-title>
        <div>
          <h3 class="headline mb-0">
            {{ $t('admin.globalSettings') }}
          </h3>
        </div>
      </v-card-title>
      <v-container style="height:440px;max-height:400px;overflow-y:scroll">
        <v-list
          subheader
          two-line
        >
          <v-subheader>{{ $t('admin.featureToggles') }}</v-subheader>
          <v-list-item>
            <v-expansion-panels
              v-model="panelvalue"
              multiple
            >
              <v-expansion-panel :key="0">
                <v-expansion-panel-header>
                  <v-checkbox v-model="fusion_animation" />
                  <v-list-item-title>{{ $t('admin.fusionAnimation') }}</v-list-item-title>
                </v-expansion-panel-header>
                <v-expansion-panel-content>
                  <v-list-item-subtitle>{{ $t('admin.fusionAnimationSubTitle') }}</v-list-item-subtitle>
                </v-expansion-panel-content>
              </v-expansion-panel>

              <v-expansion-panel key="1">
                <v-expansion-panel-header>
                  <v-checkbox v-model="arvr_toolkit" />
                  <v-list-item-title>{{ $t('admin.arvrToolkit') }}</v-list-item-title>
                </v-expansion-panel-header>
                <v-expansion-panel-content>
                  <v-list-item-subtitle>{{ $t('admin.arvrToolkitSubTitle') }}</v-list-item-subtitle>
                  <v-list>
                    <v-list-item v-if="arvr_toolkit">
                      <v-list-item-action>
                        <v-checkbox v-model="gltf_binary_output" />
                      </v-list-item-action>
                      <v-list-item-content @click="gltf_binary_output = !gltf_binary_output">
                        <v-list-item-title>{{ $t('admin.binary') }}</v-list-item-title>
                        <v-list-item-subtitle>{{ $t('admin.binarySubTitle') }}</v-list-item-subtitle>
                      </v-list-item-content>
                    </v-list-item>
                    <v-list-item v-if="arvr_toolkit">
                      <v-list-item-action>
                        <v-checkbox v-model="gltf_deduplication" />
                      </v-list-item-action>
                      <v-list-item-content @click="gltf_deduplication = !gltf_deduplication">
                        <v-list-item-title>{{ $t('admin.dedupe') }}</v-list-item-title>
                        <v-list-item-subtitle>{{ $t('admin.dedupeSubTitle') }}</v-list-item-subtitle>
                      </v-list-item-content>
                    </v-list-item>
                    <v-list-item v-if="arvr_toolkit">
                      <v-list-item-action>
                        <v-checkbox v-model="gltf_draco_compression" />
                      </v-list-item-action>
                      <v-list-item-content @click="gltf_draco_compression = !gltf_draco_compression">
                        <v-list-item-title>{{ $t('admin.dracoCompression') }}</v-list-item-title>
                        <v-list-item-subtitle>{{ $t('admin.dracoCompressionSubTitle') }}</v-list-item-subtitle>
                      </v-list-item-content>
                    </v-list-item>
                    <v-list-item v-if="arvr_toolkit">
                      <v-list-item-action>
                        <v-checkbox v-model="gltf_skip_unused_uvs" />
                      </v-list-item-action>
                      <v-list-item-content @click="gltf_skip_unused_uvs = !gltf_skip_unused_uvs">
                        <v-list-item-title>{{ $t('admin.skipUnusedUvs') }}</v-list-item-title>
                        <v-list-item-subtitle>{{ $t('admin.skipUnusedUvsSubTitle') }}</v-list-item-subtitle>
                      </v-list-item-content>
                    </v-list-item>
                  </v-list>
                </v-expansion-panel-content>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-list-item>
        </v-list>
      </v-container>
      <v-card-actions>
        <v-btn
          color="primary"
          @click="() => { saveFeatureToggles(arvr_toolkit, fusion_animation, gltf_binary_output, gltf_draco_compression, gltf_deduplication, gltf_skip_unused_uvs) }"
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
export default class GlobalSettings extends Vue {

  protected alert: boolean = false;
  protected alertMessage: string = '';
  protected arvr_toolkit: boolean = false;
  protected fusion_animation: boolean = false;
  protected gltf_binary_output: boolean = false;
  protected gltf_deduplication: boolean = false;
  protected gltf_draco_compression: boolean = false;
  protected gltf_skip_unused_uvs: boolean = false;
  protected panelvalue: number[] = [];

  beforeMount(): void {
    const loggedInSession = localStorage.getItem('loggedInSession');
    if (loggedInSession) {
      const retrievedSession = validateSession(loggedInSession);
      // detect if query param isAdminUserLoggedIn is true
      if (this.$route.query.isAdminUserLoggedIn || retrievedSession) {
        this.getFeatureToggles();
      }
    }
  }

  protected async saveFeatureToggles(
    arvr_toolkit: boolean,
    fusion_animation: boolean,
    gltf_binary_output: boolean,
    gltf_draco_compression: boolean,
    gltf_deduplication: boolean,
    gltf_skip_unused_uvs: boolean
  ): Promise<void> {
    try {
      this.$store.dispatch('setSaving', { featureToggleSetting: true });
      const res = await this.$axios({
        data: {
          animation: fusion_animation,
          arvr: arvr_toolkit,
          binary: gltf_binary_output,
          compress: gltf_draco_compression,
          dedupe: gltf_deduplication,
          uvs: gltf_skip_unused_uvs
        },
        method: 'POST',
        url: new URL('/api/admin/settings/features', config.koahost).href
      });
      if (res.status === 200) {
        this.$log.info('... saved feature toggles in database.');
        this.fusion_animation = res.data.featureToggles.fusion_animation;
        this.arvr_toolkit = res.data.featureToggles.arvr_toolkit;
        this.gltf_binary_output = res.data.featureToggles.gltf_binary_output;
        this.gltf_draco_compression = res.data.featureToggles.gltf_draco_compression;
        this.gltf_deduplication = res.data.featureToggles.gltf_deduplication;
        this.gltf_skip_unused_uvs = res.data.featureToggles.gltf_skip_unused_uvs;
        this.$store.dispatch('setFeatureToggles', {
          arvr_toolkit: res.data.featureToggles.arvr_toolkit,
          fusion_animation: res.data.featureToggles.fusion_animation,
          gltf_binary_output: res.data.featureToggles.gltf_binary_output,
          gltf_deduplication: res.data.featureToggles.gltf_deduplication,
          gltf_draco_compression: res.data.featureToggles.gltf_draco_compression,
          gltf_skip_unused_uvs: res.data.featureToggles.gltf_skip_unused_uvs
        });
      }
    } catch (err) {
      this.alert = true;
      this.alertMessage = err;
    } finally {
      this.$store.dispatch('setSaving', { featureToggleSetting: false });
    }
  }

  private async getFeatureToggles(): Promise<void> {
    try {
      const res = await this.$axios({
        method: 'GET',
        url: new URL('/api/admin/settings/features', config.koahost).href
      });
      if (res.status === 200 && res.data.length > 0) {
        this.$log.info('... retrieved feature toggles in database.');
        this.fusion_animation = res.data[0].featureToggles.fusion_animation;
        this.arvr_toolkit = res.data[0].featureToggles.arvr_toolkit;
        this.gltf_binary_output = res.data[0].featureToggles.gltf_binary_output;
        this.gltf_draco_compression = res.data[0].featureToggles.gltf_draco_compression;
        this.gltf_deduplication = res.data[0].featureToggles.gltf_deduplication;
        this.gltf_skip_unused_uvs = res.data[0].featureToggles.gltf_skip_unused_uvs;
        this.$store.dispatch('setFeatureToggles', {
          arvr_toolkit: res.data[0].featureToggles.arvr_toolkit,
          fusion_animation: res.data[0].featureToggles.fusion_animation,
          gltf_binary_output: res.data[0].featureToggles.gltf_binary_output,
          gltf_deduplication: res.data[0].featureToggles.gltf_deduplication,
          gltf_draco_compression: res.data[0].featureToggles.gltf_draco_compression,
          gltf_skip_unused_uvs: res.data[0].featureToggles.gltf_skip_unused_uvs
        });
        if (this.arvr_toolkit) {
          this.panelvalue = [1];
        }
      }
    } catch (err) {
      this.alert = true;
      this.alertMessage = err;
    }
  }

}
</script>
