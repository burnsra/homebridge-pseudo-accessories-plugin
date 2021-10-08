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

    constructor(
        public readonly log: Logger,
        public readonly config: PlatformConfig,
        public readonly api: API,
    ) {

      this.log.debug('Finished initializing platform:', this.config.name);
      this.api.on('didFinishLaunching', () => {
        this.log.debug('Executed didFinishLaunching callback');
        this.discoverDevices();
      });
    }

    configureAccessory(accessory: PlatformAccessory) {
      this.log.info('Loading accessory from cache:', accessory.displayName);
      this.accessories.push(accessory);
    }

    discoverDevices() {
      if (this.config['accessories'] && this.config['accessories'].length > 0) {
        for (const device of this.config['accessories']) {

          const uuid = this.api.hap.uuid.generate(device.name + device.accessoryType);
          const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

          if (existingAccessory) {
            if (device) {
              this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);
              new PseudoAccessory(this, existingAccessory);
              this.api.updatePlatformAccessories([existingAccessory]);
            } else if (!device) {
              this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory]);
              this.log.info('Removing existing accessory from cache:', existingAccessory.displayName);
            }
          } else {
            this.log.info('Adding new accessory:', device.name);
            const accessory = new this.api.platformAccessory(device.name, uuid);
            accessory.context.device = device;
            new PseudoAccessory(this, accessory);
            this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
          }
        }
      } else {
        if (this.accessories.length > 0) {
          this.log.info('Removing accessories...');
          for (const existingAccessory of this.accessories) {
            this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory]);
          }
        }
      }
    }

    removeAccessory (accessory) {
      this.log.info('Remove accessory', accessory.displayName);
      this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
    }
}
