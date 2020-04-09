/* eslint-disable id-blacklist */
import { model, Schema } from 'mongoose';
import { ISetting } from '../../shared/admin';

const SettingsSchema: Schema = new Schema({
  appName: {
    required: 'Must specify the name of the APP',
    type: String
  },
  email: {
    required: 'Must specify the email of the user',
    type: String
  },
  featureToggles: {
    type: Object
  },
  fileFormatToggles: {
    type: Object
  },
  hubId: {
    required: 'Must specify the ID of the selected hub',
    type: String
  },
  hubName: {
    required: 'Must specify the name of the selected hub',
    type: String
  },
  imageSrc: {
    required: 'Must specify the name of the selected hub',
    type: String
  },
  name: {
    required: 'Must specify setting name',
    type: String
  },
  projectId: {
    required: 'Must specify the ID of the selected project',
    type: String
  },
  projectName: {
    required: 'Must specify the name of the selected project',
    type: String
  },
  webAdmins: {
    default: [],
    type: Array
  }
});

export default model<ISetting>('settings', SettingsSchema);
