/* eslint-disable no-shadow */
import Vue from 'vue';
import Vuex from 'vuex';
import { MutationTree, ActionTree } from 'vuex';

import { IDefaultHubProject, IFeatureToggles, IFileFormatToggles } from '../../shared/admin';
import { ISession } from '../../shared/auth';

Vue.use(Vuex);

interface deleting {
  webhook: boolean;
}

interface loading {
  applicationName: boolean;
  companyLogo: boolean;
  defaultHubProjectSetting: boolean;
  hubsInfo: boolean;
  modelRefs: boolean;
  projectsInfo: boolean;
  userInfo: boolean;
  webHooksInfo: boolean;
}

interface saving {
  animations: boolean;
  applicationName: boolean;
  companyLogo: boolean;
  defaultHubProjectSetting: boolean;
  featureToggleSetting: boolean;
  fileFormatSetting: boolean;
  newCatalogFolder: boolean;
  newCatalogItem: boolean;
  newWebHook: boolean;
}

class State {
  public animations: string[] = [];
  public applicationName: string | null = null;
  public autodeskPath: string | null = null;
  public companyLogo: string | null = null;
  public defaultHubName: string | null = null;
  public defaultHubProjectSetting: IDefaultHubProject = {
    email: '',
    hubId: '',
    hubName: '',
    name: '',
    projectId: '',
    projectName: ''
  };
  public deleting: deleting = { webhook: false };
  public designUrn: string | null = null;
  public endDate: string | null = null;
  public featureToggles: IFeatureToggles = {
    arvr_toolkit: false,
    fusion_animation: false,
    gltf_binary_output: false,
    gltf_deduplication: false,
    gltf_draco_compression: false,
    gltf_skip_unused_uvs: false,
  };
  public fileFormatToggles: IFileFormatToggles | null = null;
  public fileType: string | null = null;
  public hubs: string[] = [];
  public isAdminUserLoggedIn: boolean | null = null;
  public loading: loading = {
    applicationName: false,
    companyLogo: false,
    defaultHubProjectSetting: false,
    hubsInfo: false,
    modelRefs: false,
    projectsInfo: false,
    userInfo: false,
    webHooksInfo: false,
  };
  public modelRefs: string[] = [];
  public projects: string[] = [];
  public rootFileName: string | null = null;
  public saving: saving = {
    animations: false,
    applicationName: false,
    companyLogo: false,
    defaultHubProjectSetting: false,
    featureToggleSetting: false,
    fileFormatSetting: false,
    newCatalogFolder: false,
    newCatalogItem: false,
    newWebHook: false
  };
  public selectedCatalog = {};
  public selectedModel = {};
  public selectedStoryboard = {};
  public showCatalogTree = true;
  public startDate: string | null = null;
  public svfUrn: string | null = null;
  public user: ISession = {
    email: '',
    fullName: '',
    picture: ''
  };
  public viewerToken: string | null = null;
  public webAdmins: string[] = [];
}

const actions = <ActionTree<State, any>>{
  setAnimations({ commit }, animations: State['animations']) {
    commit('setAnimations', animations);
  },
  setApplicationName({ commit }, applicationName: State['applicationName']) {
    commit('setApplicationName', applicationName);
  },
  setAutodeskPath({ commit }, autodeskPath: State['autodeskPath']) {
    commit('setAutodeskPath', autodeskPath);
  },
  setCompanyLogo({ commit }, setting: State['companyLogo']) {
    commit('setCompanyLogo', setting);
  },
  setDefaultHubName({ commit }, name: State['defaultHubName']) {
    commit('setDefaultHubName', name);
  },
  setDefaultHubProjectSetting({ commit }, setting: State['defaultHubProjectSetting']) {
    commit('setDefaultHubProjectSetting', setting);
  },
  setDeleting({ commit }, deleting: State['deleting']) {
    commit('setDeleting', deleting);
  },
  setDesignUrn({ commit }, designUrn: State['designUrn']) {
    commit('setDesignUrn', designUrn);
  },
  setEndDate({ commit }, endDate: State['endDate']) {
    commit('setEndDate', endDate);
  },
  setFeatureToggles({ commit }, features: State['featureToggles']) {
    commit('setFeatureToggles', features);
  },
  setFileFormatToggles({ commit }, fileformats: State['fileFormatToggles']) {
    commit('setFileFormatToggles', fileformats);
  },
  setFileType({ commit }, type: State['fileType']) {
    commit('setFileType', type);
  },
  setHubs({ commit }, hubs: State['hubs']) {
    commit('setHubs', hubs);
  },
  setLoading({ commit }, loading: State['loading']) {
    commit('setLoading', loading);
  },
  setModelRefs({ commit }, refs: State['modelRefs']) {
    commit('setModelRefs', refs);
  },
  setProjects({ commit }, projects: State['projects']) {
    commit('setProjects', projects);
  },
  setRootFileName({ commit }, rootFileName: State['rootFileName']) {
    commit('setRootFileName', rootFileName);
  },
  setSaving({ commit }, saving: State['saving']) {
    commit('setSaving', saving);
  },
  setSelectedCatalog({ commit }, catalog: State['selectedCatalog']) {
    commit('setSelectedCatalog', catalog);
  },
  setSelectedModel({ commit }, model: State['selectedModel']) {
    commit('setSelectedModel', model);
  },
  setSelectedStoryboard({ commit }, storyboard: State['selectedStoryboard']) {
    commit('setSelectedStoryboard', storyboard);
  },
  setStartDate({ commit }, startDate: State['startDate']) {
    commit('setStartDate', startDate);
  },
  setSvfUrn({ commit }, svfUrn: State['svfUrn']) {
    commit('setSvfUrn', svfUrn);
  },
  setUser({ commit }, user: State['user']) {
    commit('setUser', user);
  },
  setUserEmail({ commit }, email: ISession['email']) {
    commit('setUserEmail', email);
  },
  setUserFullName({ commit }, fullName: ISession['fullName']) {
    commit('setUserFullName', fullName);
  },
  setUserPicture({ commit }, pictureUri: ISession['picture']) {
    commit('setUserPicture', pictureUri);
  },
  setViewerToken({ commit }, viewerToken: State['viewerToken']) {
    commit('setViewerToken', viewerToken);
  },
  setWebAdmins({ commit }, setting: State['webAdmins']) {
    commit('setWebAdmins', setting);
  },
  setShowCatalogTree({ commit }, show: State['showCatalogTree']) {
    commit('setShowCatalogTree', show);
  }
};

const mutations = <MutationTree<State>>{
  setAnimations(state: State, animations: State['animations']) {
    state.animations = animations;
  },
  setApplicationName(state: State, appName: State['applicationName']) {
    state.applicationName =  appName;
  },
  setAutodeskPath(state: State, autodeskPath: State['autodeskPath']) {
    state.autodeskPath = autodeskPath;
  },
  setCompanyLogo(state: State, logo: State['companyLogo']) {
    state.companyLogo =  logo;
  },
  setDefaultHubName(state: State, name: State['defaultHubName']) {
    state.defaultHubName = name;
  },
  setDefaultHubProjectSetting(state: State, setting: State['defaultHubProjectSetting']) {
    Object.assign(state.defaultHubProjectSetting, setting);
  },
  setDeleting(state: State, deleting: State['deleting']) {
    Object.assign(state.deleting, deleting);
  },
  setDesignUrn(state: State, designUrn: State['designUrn']) {
    state.designUrn = designUrn;
  },
  setEndDate(state: State, endDate: State['endDate']) {
    state.endDate = endDate;
  },
  setFeatureToggles(state: State, features: State['featureToggles']) {
    Object.assign(state.featureToggles, features);
  },
  setFileFormatToggles(state: State, fileformats: State['fileFormatToggles']) {
    Object.assign(state.fileFormatToggles, fileformats);
  },
  setFileType(state: State, type: State['fileType']) {
    state.fileType = type;
  },
  setHubs(state: State, hubs: State['hubs']) {
  state.hubs = hubs;
  },
  setLoading(state: State, loading: State['loading']) {
    Object.assign(state.loading, loading);
  },
  setModelRefs(state: State, refs: State['modelRefs']) {
  state.modelRefs = refs;
  },
  setProjects(state: State, projects: State['projects']) {
    state.projects = projects;
  },
  setRootFileName(state: State, rootFileName: State['rootFileName']) {
    state.rootFileName = rootFileName;
  },
  setSaving(state: State, saving: State['saving']) {
    Object.assign(state.saving, saving);
  },
  setSelectedCatalog(state: State, catalog: State['selectedCatalog']) {
    Vue.set(state, 'selectedCatalog', catalog);
  },
  setSelectedModel(state: State, model: State['selectedModel']) {
    Vue.set(state, 'selectedModel', model);
  },
  setSelectedStoryboard(state: State, storyboard: State['selectedStoryboard']) {
    Vue.set(state, 'selectedStoryboard', storyboard);
  },
  setStartDate(state: State, startDate: State['startDate']) {
    state.startDate = startDate;
  },
  setSvfUrn(state: State, svfUrn: State['svfUrn']) {
    state.svfUrn = svfUrn;
  },
  setUser(state: State, user: State['user']) {
    state.user = user;
  },
  setUserEmail(state: State, email: ISession['email']) {
    if (state.user) { state.user.email = email; }
  },
  setUserFullName(state: State, fullName: ISession['fullName']) {
    if (state.user) { state.user.fullName = fullName; }
  },
  setUserPicture(state: State, pictureUri: ISession['picture']) {
    if (state.user) { state.user.picture = pictureUri; }
  },
  setViewerToken(state: State, viewerToken: State['viewerToken']) {
    state.viewerToken = viewerToken;
  },
  setWebAdmins(state: State, setting: State['webAdmins']) {
    Object.assign(state.webAdmins, setting);
  },
  setShowCatalogTree(state: State, show: State['showCatalogTree']) {
    state.showCatalogTree =  show;
  }
};

export default new Vuex.Store({
    state: new State(),
    mutations,
    actions
});
