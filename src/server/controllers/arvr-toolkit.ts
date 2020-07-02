import config from 'config';
import { GltfWriter, SvfReader } from 'forge-convert-utils';
import { IDerivativeResourceChild, ManifestHelper, ModelDerivativeClient } from 'forge-server-utils';
import { IAuthOptions } from 'forge-server-utils/dist/common';
import fs from 'fs';
import fsExtra from 'fs-extra';
import gltfPipeline from 'gltf-pipeline';
import log4 from 'koa-log4';
import path from 'path';
import { ErrorHandler } from '../helpers/error-handler';
import { Admin } from './admin';

const logger = log4.getLogger('arvr-toolkit');
if (process.env.NODE_ENV === 'development') { logger.level = 'debug'; }

export class ArvrToolkit {

  private adminController: Admin;
  private errorHandler: ErrorHandler;

  public constructor() {
    this.adminController = new Admin();
    this.errorHandler = new ErrorHandler();
  }

  /**
   * Convert Viewables
   * @param urn
   * @param guid
   * @param folder
   */
  public async convertToGltf(urn: string, guid: string, folder: string): Promise<void> {
    try {
      const viewableFolder = path.join(folder, guid); // colon ":" is an invalid character in UNIX folder names
      const outputFolder = path.join(viewableFolder, 'gltf');
      const auth: IAuthOptions = {
        client_id: config.get('oauth2.clientID'),
        client_secret: config.get('oauth2.clientSecret')
      };
      const modelDerivativeClient = new ModelDerivativeClient(auth);
      const helper = new ManifestHelper(await modelDerivativeClient.getManifest(urn));
      const derivatives = helper.search({ type: 'resource', role: 'graphics' }) as IDerivativeResourceChild[];
      const featureToggles = await this.adminController.getSetting('featureToggles');
      if (
        !!featureToggles
        && featureToggles[0].featureToggles.arvr_toolkit
      ) {
        const readerOptions = {
          log: (msg: string): void => logger.info('Reader', msg)
        };
        const writerOptions = {
          center: true,
          deduplicate: featureToggles[0].featureToggles.gltf_deduplication,
          log: (msg: string): void => logger.info('Writer', msg),
          skipUnusedUvs: featureToggles[0].featureToggles.gltf_skip_unused_uvs
        };
        for (const derivative of derivatives.filter((d) => (d.mime === 'application/autodesk-svf'))) {
          const writer = new GltfWriter(writerOptions);
          const reader = await SvfReader.FromDerivativeService(urn, derivative.guid, auth);
          const svf = await reader.read(readerOptions);
          await writer.write(svf, path.join(outputFolder, 'output', guid));
          const metadata = await reader.getMetadata();
          // captures units
          fs.writeFileSync(path.join(outputFolder, 'output', 'metadata.json'), JSON.stringify(metadata));
          const guiDir = path.join(outputFolder, 'output', guid);
          const gltfOptions = {
            resourceDirectory: guiDir,
            separate: false,
            dracoOptions: { compressionLevel: 10 }
          };
          if (featureToggles[0].featureToggles.gltf_binary_output) {
            const gltfToGlb = gltfPipeline.gltfToGlb;
            const gltf = fsExtra.readJsonSync(path.join(guiDir, 'output.gltf'));
            const glb = await gltfToGlb(gltf, gltfOptions);
            fsExtra.writeFileSync(path.join(guiDir, 'output.glb'), glb.glb);
          }
          if (featureToggles[0].featureToggles.gltf_draco_compression) {
            const processGltf = gltfPipeline.processGltf;
            const gltf = fsExtra.readJsonSync(path.join(guiDir, 'output.gltf'));
            const draco = await processGltf(gltf, gltfOptions);
            fsExtra.writeJSONSync(path.join(guiDir, 'output-draco.gltf'), draco.gltf);
          }
        }
      }
    } catch (err) {
      this.errorHandler.handleError(err);
    }
  }

}
