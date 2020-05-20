/* eslint-disable no-console */
import { Admin } from '../src/server/controllers/admin';
import  * as config from 'config'; // This seems to be a bug, using esModuleInterop=true, we should not need star imports;
import 'jest';
import { connect, disconnect } from 'mongoose';

const adminControlller = new Admin();

/**
 * To do something once before all the tests run
 */
beforeAll(() => {
  connect(
    config.get('db.url'), {
      useFindAndModify: false,
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  )
  .then(() => {
    // tslint:disable-next-line: no-console
    console.info('... MongoDB Connected');
  })
  .catch(err => {
    // tslint:disable-next-line: no-console
    console.error('Error occurred trying to connect to MongoDB', err);
  });
  // tslint:disable-next-line: no-console
  console.info('... Jest starting');
});

/**
 * Tear down after all tests end
 */
afterAll(done => {
  disconnect(done);
  // tslint:disable-next-line: no-console
  console.info('... server closed');
});

describe(
  'Set Application Name',
  () => {
    test('Set Application Name', async () => {
      const setting = await adminControlller.setApplicationName({
        name: 'applicationName',
        value: 'ACME Catalog'
      });
      if(!!setting) {
        expect(typeof setting.appName).toEqual('string');
      }
    });
  }
);

describe(
  'Get Application Name',
  () => {
    test('Get Application Name', async () => {
      const settings = await adminControlller.getSetting('applicationName');
      if (settings?.length === 1) {
        const setting = settings[0];
        expect(Array.isArray(settings)).toEqual(true);
        expect(typeof setting.appName).toEqual('string');
        expect(setting.appName).toEqual('ACME Catalog');
      }
  });
});

describe(
  'Get Company Logo',
  () => {
    test('Get Company Logo', async () => {
      const settings = await adminControlller.getSetting('companyLogo');
      if (settings?.length === 1) {
        const setting = settings[0];
        expect(Array.isArray(settings)).toEqual(true);
        expect(typeof setting.imageSrc).toEqual('string');
        expect(setting.imageSrc).toMatch(/^(data\:image\/png\;base64)/);
      }
  });
});

describe(
  'Set Feature Toggles',
  () => {
    test('set Feature Toggles', async () => {
      const setting = await adminControlller.setFeatureToggles({
        animation: true,
        arvr: true,
        binary: true,
        compress: true,
        dedupe: false,
        uvs: true
      });
      if(!!setting) {
        expect(typeof setting.featureToggles).toEqual('object');
      }
  });
});

describe(
  'Get Feature Toggles',
  () => {
    test('Get Feature Toggles', async () => {
      const settings = await adminControlller.getSetting('featureToggles');
      if (settings?.length === 1) {
        const setting = settings[0];
        expect(Array.isArray(settings)).toEqual(true);
        expect(typeof setting.featureToggles).toEqual('object');
        expect(setting.featureToggles).toEqual(expect.objectContaining({
          arvr_toolkit: expect.any(Boolean),
          fusion_animation: expect.any(Boolean),
          gltf_binary_output: expect.any(Boolean),
          gltf_deduplication: expect.any(Boolean),
          gltf_draco_compression: expect.any(Boolean),
          gltf_skip_unused_uvs: expect.any(Boolean)
        }));
      }
  });
});

describe(
  'Get File Formats',
  () => {
    test('Get File Formats', async () => {
      const settings = await adminControlller.getSetting('fileFormatToggles');
      if (settings?.length === 1) {
        const setting = settings[0];
        expect(Array.isArray(settings)).toEqual(true);
        expect(typeof setting.fileFormatToggles).toEqual('object');
        expect(setting.fileFormatToggles).toEqual(expect.objectContaining({
          creo: expect.any(Boolean),
          dwg: expect.any(Boolean),
          fbx: expect.any(Boolean),
          fusion: expect.any(Boolean),
          inventor: expect.any(Boolean),
          navisworks: expect.any(Boolean),
          obj: expect.any(Boolean),
          solidworks: expect.any(Boolean),
          step: expect.any(Boolean)
        }));
      }
  });
});

describe(
  'Get Setting by Name and Email',
  () => {
    test('Get Settings by Name and Email', async () => {
      const name = 'defaultHubProject';
      const email = 'bastien.mazeran@autodesk.com';
      const settings = await adminControlller.getSettingByNameAndEmail(name, email);
      if (settings?.length === 1) {
        const setting = settings[0];
        expect(Array.isArray(settings)).toEqual(true);
        expect(typeof setting).toEqual('object');
      }
  });
});

describe(
  'Get Web Admins',
  () => {
    test('Get Web Admins', async () => {
      const settings = await adminControlller.getSetting('webAdmins');
      if (settings?.length === 1) {
        const setting = settings[0];
        expect(Array.isArray(settings)).toEqual(true);
        expect(Array.isArray(setting.webAdmins)).toEqual(true);
      }
    });
});
