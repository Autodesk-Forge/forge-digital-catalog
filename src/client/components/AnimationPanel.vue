<template>
  <v-row>
    <v-col>
      <v-card flat>
        <v-content>
          <v-container
            fluid
          >
            <v-row>
              <v-col 
                v-for="storyboard in animations"
                :key="storyboard.name"
                cols="12"
                md="6"
                lg="3"
                @click="loadAnimationSvf(storyboard)"
              >
                <v-chip>
                  <v-avatar>
                    <img
                      alt="storyboard.name"
                      :src="storyboard.imageDataUri"
                    >
                  </v-avatar>
                  {{ storyboard.name }}
                </v-chip>
              </v-col>
            </v-row>
          </v-container>
        </v-content>
      </v-card>
    </v-col>
  </v-row>
</template>

<style>
@import "../../../public/css/TreeFormat.css";
</style>

<script>
export default {
  data() {
    return {
      animations: []
    }
  },
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