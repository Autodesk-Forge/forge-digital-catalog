'use strict';

import axios from 'axios';
import Vue, { VueConstructor } from 'vue';
import appConfig from './../config';

// Full config:  https://github.com/axios/axios#request-config
// axios.defaults.baseURL = process.env.baseURL || process.env.apiUrl || '';
// axios.defaults.headers.common['Authorization'] = AUTH_TOKEN;
// axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';

const axiosOptions = {
  // baseURL: process.env.baseURL || process.env.apiUrl || ""
  // timeout: 60 * 1000, // Timeout
  // withCredentials: true, // Check cross-site Access-Control
  crossDomain: true,
  withCredentials: true
};

const axiosInstance = axios.create(axiosOptions);

axiosInstance.interceptors.request.use(
  (config) => {
    // Do something before request is sent
    return config;
  },
  (error) => {
    // Do something with request error
    return Promise.reject(error);
  }
);

// Add a response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    // Do something with response data
    return response;
  },
  (error) => {
    // Do something with response error
    const originalRequest = error.config;
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      window.location.href = new URL('/api/forge/authenticate?state=admin', appConfig.koahost).href;
      return;
    }
    if (
      error.response.status === 404 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/api/catalog/file/name') // valid 404 is no catalog item exists by name
    ) {
      originalRequest._retry = true;
      window.location.href = '/';
      return;
    }
    return Promise.reject(error);
  }
);

const AxiosPlugin = {
  install(vue: VueConstructor, options: any[]) {
    vue.mixin({
      mounted() {
        (vue as any).$log.info('Mounted!');
      }
    });
  }
};

AxiosPlugin.install = (vue: VueConstructor, options: any[]) => {
  try {
    (vue as any).axios = axiosInstance;
    (window as any).axios = axiosInstance;
    Object.defineProperties(Vue.prototype, {
      $axios: {
        get() {
          return axiosInstance;
        }
      },
      axios: {
        get() {
          return axiosInstance;
        }
      }
    });
  } catch (err) {
    (Vue as any).$log.error(`AxiosPlugin.install: error : ${err}`);
  }
};

Vue.use(AxiosPlugin);

export default Plugin;
