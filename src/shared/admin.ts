import mongoose from 'mongoose';

export interface IApplicationName {
  name: string;
  value: string;
}

export interface ICompanyLogo {
  imageSrc: string;
  name: string;
}

export interface IDefaultHubProject {
  email: string;
  hubId: string;
  hubName: string;
  name: string;
  projectId: string;
  projectName: string;
}

export interface IFeatureToggles {
  arvr_toolkit: boolean;
  fusion_animation: boolean;
  gltf_binary_output: boolean;
  gltf_deduplication: boolean;
  gltf_draco_compression: boolean;
  gltf_skip_unused_uvs: boolean;
}

export interface IFileFormatToggles {
  dwg: boolean;
  creo: boolean;
  fbx: boolean;
  fusion: boolean;
  inventor: boolean;
  navisworks: boolean;
  obj: boolean;
  solidworks: boolean;
  step: boolean;
}

export interface ISetting extends mongoose.Document {
  appName: string;
  imageSrc: string;
  webAdmins: string[];
  email: string;
  featureToggles: IFeatureToggles;
  fileFormatToggles: IFileFormatToggles;
  hubId: string;
  hubName: string;
  name: string;
  projectId: string;
  projectName: string;
}
