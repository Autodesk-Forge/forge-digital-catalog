<script lang='ts'>
import { Component, Vue } from 'vue-property-decorator';
import config from '../config';

@Component
export default class Login extends Vue {

  async mounted(): Promise<void> {
    try {
      this.$router.push({ path: `${config.koahost}/api/forge/authenticate?state=admin` });
    } catch (err) {
      this.$log.error(err);
    }
  }

}
</script>