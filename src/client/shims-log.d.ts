import { Log } from 'vuejs-logger';

declare module 'vue/types/vue' {
	interface Vue {
		$log: Log;
	}
}
