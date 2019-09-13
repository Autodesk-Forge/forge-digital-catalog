<template>
  <v-row>
    <v-col>
      <v-card flat>
        <v-content>
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
        </v-content>
      </v-card>
    </v-col>
  </v-row>
</template>

<style>
@import "../../../src/client/public/css/TreeFormat.css"
</style>

<script>
export default {
  data() {
    return {
      animations: []
    }
  },
  mounted: function () {
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
    loadAnimationSvf(storyboard) {
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