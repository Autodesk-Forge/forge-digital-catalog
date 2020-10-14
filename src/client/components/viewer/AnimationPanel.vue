<template>
  <v-row>
    <v-col>
      <v-card flat>
        <v-main>
          <v-container
            fluid
          >
            <v-chip-group
              active-class="primary--text"
              :column="true"
            >
              <v-chip 
                v-for="storyboard in animations" 
                :key="storyboard.name"
                @click="loadAnimationSvf(storyboard)"
              >
                <v-avatar>
                  <img
                    alt="storyboard.name"
                    :src="storyboard.imageDataUri"
                  >
                </v-avatar>
                {{ storyboard.name }}
              </v-chip>
            </v-chip-group>
          </v-container>
        </v-main>
      </v-card>
    </v-col>
  </v-row>
</template>

<script lang='ts'>
import { Component, Vue } from 'vue-property-decorator';

@Component
export default class AnimationPanel extends Vue {

  protected alert: boolean = false;
  protected alertMessage: string = '';
  protected animations: string[] = [];

  mounted(): void {
    this.$root.$on('clearStoryboards', () => {
      this.$log.info('... clearing animation panel');
      this.animations = [];
    });
    this.$root.$on('setAnimations', (animations: string[]) => {
      this.$log.info('... received setAnimations event');
      this.animations = animations;
    });
  }

  protected loadAnimationSvf(storyboard: string): void {
    try {
      this.$store.dispatch('setSelectedStoryboard', storyboard);
      this.$root.$emit('selectedStoryboard', storyboard);
    } catch (err) {
      this.alert = true;
      this.alertMessage = err;
    }
  }

}
</script>
