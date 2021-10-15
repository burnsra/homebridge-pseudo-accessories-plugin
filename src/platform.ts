import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';

import { PseudoAccessory } from './platformAccessory';
import { PLATFORM_NAME, PLUGIN_NAME } from './settings';

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class PseudoPlatform implements DynamicPlatformPlugin {
    public readonly Service: typeof Service = this.api.hap.Service;
    public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

    public readonly accessories: PlatformAccessory[] = [];
    private readonly cacheAccessories: {
      [uuid: string]: PlatformAccessory;
    } = {};

    private readonly configAccessories: {
      [uuid: string]: PlatformAccessory;
    } = {};

    constructor(
        public readonly log: Logger,
        public readonly config: PlatformConfig,
        public readonly api: API,
    ) {

      this.log.info('Finished initializing platform:', this.config.name);
      this.api.on('didFinishLaunching', () => {
        this.log.debug('Executed didFinishLaunching callback');
        this.discoverDevices();
      });
      this.cacheAccessories = {};
      this.configAccessories = {};
    }

    configureAccessory(accessory: PlatformAccessory) {
      this.log.info(`Loading accessory from cache ${accessory.displayName} (${accessory.UUID})`);
      this.accessories.push(accessory);
      this.cacheAccessories[accessory.UUID] = accessory;
    }

    discoverDevices() {
      if (this.config['accessories'] && this.config['accessories'].length > 0) {
        for (const device of this.config['accessories']) {
          const uuid = this.api.hap.uuid.generate(device.name + device.accessoryType);
          const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

          if (existingAccessory) {
            this.log.info(`Restoring existing accessory from cache ${existingAccessory.displayName} (${existingAccessory.UUID})`);
            new PseudoAccessory(this, existingAccessory);
            this.api.updatePlatformAccessories([existingAccessory]);
            this.configAccessories[existingAccessory.UUID] = existingAccessory;
          } else {
            this.log.info(`Adding new accessory ${device.name} (${uuid})`);
            const accessory = new this.api.platformAccessory(device.name, uuid);
            accessory.context.device = device;
            new PseudoAccessory(this, accessory);
            this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
            this.configAccessories[accessory.UUID] = accessory;
          }
        }
      }
      if (this['accessories'] && this['accessories'].length > 0) {
        for (const device of this['accessories']) {
          if (!Object.prototype.hasOwnProperty.call(this.configAccessories, device.UUID)) {
            this.removeAccessory(device);
          }
        }
      }
    }

    removeAccessory (accessory) {
      this.log.info(`Removing accessory ${accessory.displayName} (${accessory.UUID})`);
      this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
    }
}
