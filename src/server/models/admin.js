const mongoose = require('mongoose')

const SettingsSchema = new mongoose.Schema({
  appName: {
    required: 'Must specify the name of the APP',
    type: String
  },
  imageSrc: {
    required: 'Must specify the name of the selected hub',
    type: String
  },
  webAdmins: {
    type: Array,
    default: []
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
  }
})

module.exports = mongoose.model('settings', SettingsSchema)
