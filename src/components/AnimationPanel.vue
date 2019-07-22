<template>
  <v-layout>
    <v-flex>
      <v-card flat>
        <v-content>
          <v-container fluid grid-list-md>
            <v-layout row wrap>
              <v-flex 
                xs12
                md6
                lg3
                v-for="storyboard in animations"
                :key="storyboard.name"
                @click="loadAnimationSvf(storyboard)"
              >
                <v-chip>
                  <v-avatar>
                    <img alt="storyboard.name" :src="storyboard.imageDataUri">
                  </v-avatar>
                  {{ storyboard.name }}
                </v-chip>
              </v-flex>
            </v-layout>
          </v-container>
        </v-content>
      </v-card>
    </v-flex>
  </v-layout>
</template>

<style>
@import "../../public/css/TreeFormat.css";
</style>

<script>
export default {
  mounted: async function () {
    this.$root.$on('clearStoryboards', () => {
      this.$log.info('... clearing animation panel')
      this.animations = []
    })
    this.$root.$on('setAnimations', (animations) => {
      this.$log.info('... received setAnimations event')
      this.animations = animations
    })
  },
  data() {
    return {
      animations: []
    }
  },
  methods: {
    async loadAnimationSvf(storyboard) {
      try {
        this.$store.dispatch('setSelectedStoryboard', storyboard)
        this.$root.$emit('selectedStoryboard', storyboard)
      } catch (err) {
        this.alert = true
        this.alertMessage = err
      }
    }
  }
}
</script>