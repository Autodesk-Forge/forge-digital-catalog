import axios from 'axios'
import Vue from 'vue'

declare module 'vue/types/vue' {
  interface Vue {
    $axios: typeof axios
  }
}