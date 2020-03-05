import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

export default new Vuex.Store({
  actions: {
    setAnimations({ commit }, animations) {
      commit('setAnimations', animations);
    },
    setAutodeskPath({ commit }, autodeskPath) {
      commit('setAutodeskPath', autodeskPath);
    },
    setDefaultHubName({ commit }, name) {
      commit('setDefaultHubName', name);
    },
    setDefaultHubProjectSetting({ commit }, setting) {
      commit('setDefaultHubProjectSetting', setting);
    },
    setDeleting({ commit }, deleting) {
      commit('setDeleting', deleting);
    },
    setDesignUrn({ commit }, designUrn) {
      commit('setDesignUrn', designUrn);
    },
    setEndDate({ commit }, endDate) {
      commit('setEndDate', endDate);
    },
    setFeatureToggles({ commit }, features) {
      commit('setFeatureToggles', features);
    },
    setFileFormatToggles({ commit }, fileformats) {
      commit('setFileFormatToggles', fileformats);
    },
    setFileType({ commit }, type) {
      commit('setFileType', type);
    },
    setHubs({ commit }, hubs) {
      commit('setHubs', hubs);
    },
    setLoading({ commit }, loading) {
      commit('setLoading', loading);
    },
    setModelRefs({ commit }, refs) {
      commit('setModelRefs', refs);
    },
    setProjects({ commit }, projects) {
      commit('setProjects', projects);
    },
    setRootFileName({ commit }, rootFileName) {
      commit('setRootFileName', rootFileName);
    },
    setSaving({ commit }, saving) {
      commit('setSaving', saving);
    },
    setSelectedCatalog({ commit }, catalog) {
      commit('setSelectedCatalog', catalog);
    },
    setSelectedModel({ commit }, model) {
      commit('setSelectedModel', model);
    },
    setSelectedStoryboard({ commit }, storyboard) {
      commit('setSelectedStoryboard', storyboard);
    },
    setStartDate({ commit }, startDate) {
      commit('setStartDate', startDate);
    },
    setSvfUrn({ commit }, svfUrn) {
      commit('setSvfUrn', svfUrn);
    },
    setUser({ commit }, user) {
      commit('setUser', user);
    },
    setUserEmail({ commit }, email) {
      commit('setUserEmail', email);
    },
    setUserFullName({ commit }, fullName) {
      commit('setUserFullName', fullName);
    },
    setUserPicture({ commit }, pictureUri) {
      commit('setUserPicture', pictureUri);
    },
    setViewerToken({ commit }, viewerToken) {
      commit('setViewerToken', viewerToken);
    },
    setWebAdmins({ commit }, setting) {
      commit('setWebAdmins', setting);
    },
    setCompanyLogo({ commit }, setting) {
      commit('setCompanyLogo', setting);
    },
    setApplicationName({ commit }, appName) {
      commit('setApplicationName', appName);
    },
    setShowCatalogTree({ commit }, show) {
      commit('setShowCatalogTree', show);
    }

  },
  mutations: {
    setAnimations(state, animations) {
      state.animations = animations;
    },
    setAutodeskPath(state, autodeskPath) {
      state.autodeskPath = autodeskPath;
    },
    setDefaultHubName(state, name) {
      state.defaultHubName = name;
    },
    setDefaultHubProjectSetting(state, setting) {
      Object.assign(state.defaultHubProjectSetting, setting);
    },
    setDeleting(state, deleting) {
      Object.assign(state.deleting, deleting);
    },
    setDesignUrn(state, designUrn) {
      state.designUrn = designUrn;
    },
    setEndDate(state, endDate) {
      state.endDate = endDate;
    },
    setFeatureToggles(state, features) {
      Object.assign(state.featureToggles, features);
    },
    setFileFormatToggles(state, fileformats) {
      Object.assign(state.fileFormatToggles, fileformats);
    },
    setFileType(state, type) {
      state.fileType = type;
    },
    setHubs(state, hubs) {
      state.hubs = hubs;
    },
    setLoading(state, loading) {
      Object.assign(state.loading, loading);
    },
    setModelRefs(state, refs) {
      state.modelRefs = refs;
    },
    setProjects(state, projects) {
      state.projects = projects;
    },
    setRootFileName(state, rootFileName) {
      state.rootFileName = rootFileName;
    },
    setSaving(state, saving) {
      Object.assign(state.saving, saving);
    },
    setSelectedCatalog(state, catalog) {
      Vue.set(state, 'selectedCatalog', catalog);
    },
    setSelectedModel(state, model) {
      Vue.set(state, 'selectedModel', model);
    },
    setSelectedStoryboard(state, storyboard) {
      Vue.set(state, 'selectedStoryboard', storyboard);
    },
    setStartDate(state, startDate) {
      state.startDate = startDate;
    },
    setSvfUrn(state, svfUrn) {
      state.svfUrn = svfUrn;
    },
    setUser(state, user) {
      state.user = user;
    },
    setUserEmail(state, email) {
      state.user.email = email;
    },
    setUserFullName(state, fullName) {
      state.user.fullName = fullName;
    },
    setUserPicture(state, pictureUri) {
      state.user.picture = pictureUri;
    },
    setViewerToken(state, viewerToken) {
      state.viewerToken = viewerToken;
    },
    setWebAdmins(state, setting) {
      Object.assign(state.webAdmins, setting);
    },
    setCompanyLogo(state, setting) {
      state.companyLogo =  setting;
    },
    setApplicationName(state, appName) {
      state.applicationName =  appName;
    },
    setShowCatalogTree(state, show) {
      state.showCatalogTree =  show;
    }
  },
  state: {
    animations: [],
    applicationName: null,
    autodeskPath: null,
    companyLogo: null,
    defaultHubName: null,
    defaultHubProjectSetting: {
      email: null,
      hubId: null,
      hubName: null,
      name: null,
      projectId: null,
      projectName: null
    },
    deleting: {
      webHook: false
    },
    designUrn: null,
    endDate: null,
    featureToggles: {
      animation: null,
      arvr: null,
      binary: null,
      compress: null,
      dedupe: null,
      uvs: null
    },
    fileFormatToggles: {
      creo: null,
      dwg: null,
      fbx: null,
      fusion: null,
      inventor: null,
      navisworks: null,
      obj: null,
      solidworks: null,
      step: null
    },
    fileType: null,
    hubs: [],
    isAdminUserLoggedIn: false,
    loading: {
      applicationName: false,
      companyLogo: false,
      defaultHubProjectSetting: false,
      hubsInfo: false,
      modelRefs: false,
      projectsInfo: false,
      userInfo: false,
      webHooksInfo: false,
    },
    modelRefs: [],
    projects: [],
    rootFileName: null,
    saving: {
      animations: false,
      applicationName: false,
      companyLogo: false,
      defaultHubProjectSetting: false,
      featureToggleSetting: false,
      fileFormatSetting: false,
      newCatalogFolder: false,
      newCatalogItem: false,
      newWebHook: false
    },
    selectedCatalog: {},
    selectedModel: {},
    selectedStoryboard: {},
    showCatalogTree: true,
    startDate: null,
    svfUrn: null,
    user: {
      email: null,
      fullName: null,
      picture: null
    },
    viewerToken: null,
    webAdmins: []
  }
});
