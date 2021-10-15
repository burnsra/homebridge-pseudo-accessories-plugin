import { PlatformAccessory, CharacteristicValue, ChangeReason } from 'homebridge';

import { PseudoPlatform } from './platform';

export class PseudoAccessory {
    private cacheDirectory: string;
    private service;
    private sensor;
    private storage;
    private state: boolean;

    constructor(
        private readonly platform: PseudoPlatform,
        private readonly accessory: PlatformAccessory,
    ) {

      this.cacheDirectory = this.platform.api.user.persistPath();
      this.storage = require('node-persist');
      this.storage.initSync({
        dir: this.cacheDirectory,
        forgiveParseErrors: true,
      });

        this.accessory.getService(this.platform.Service.AccessoryInformation)!
          .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Pseudo')
          .setCharacteristic(this.platform.Characteristic.Model, 'Pseudo (' + this.accessory.context.device.accessoryType + ')')
          .setCharacteristic(this.platform.Characteristic.SerialNumber, this.accessory.UUID);

        switch (this.accessory.context.device.accessoryType) {
          case 'light':
            this.service = this.accessory.getService(this.platform.Service.Lightbulb) ||
                this.accessory.addService(this.platform.Service.Lightbulb);
            break;
          case 'outlet':
            this.service = this.accessory.getService(this.platform.Service.Outlet) ||
                this.accessory.addService(this.platform.Service.Outlet);
            break;
          case 'switch':
            this.service = this.accessory.getService(this.platform.Service.Switch) ||
                this.accessory.addService(this.platform.Service.Switch);
            break;
          default:
            this.service = this.accessory.getService(this.platform.Service.Lightbulb) ||
                this.accessory.addService(this.platform.Service.Lightbulb);
            this.platform.log.error(
              'Found Unknown Accessory Type:',
              this.accessory.context.device.name,
              '(' + this.accessory.context.device.accessoryType + ')',
            );
            break;
        }

        switch (this.accessory.context.device.sensorType) {
          case 'contact':
            this.sensor = this.accessory.getService(this.platform.Service.ContactSensor) ||
                this.accessory.addService(this.platform.Service.ContactSensor);
            break;
          case 'light':
            this.sensor = this.accessory.getService(this.platform.Service.LightSensor) ||
                this.accessory.addService(this.platform.Service.LightSensor);
            break;
          case 'motion':
            this.sensor = this.accessory.getService(this.platform.Service.MotionSensor) ||
                this.accessory.addService(this.platform.Service.MotionSensor);
            break;
          case 'occupancy':
            this.sensor = this.accessory.getService(this.platform.Service.OccupancySensor) ||
                this.accessory.addService(this.platform.Service.OccupancySensor);
            break;
          default:
            this.platform.log.debug(
              'Found Unknown Sensor Type:',
              this.accessory.context.device.name,
              '(' + this.accessory.context.device.sensorType + ')',
            );
            break;
        }

        this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.name);

        this.service.getCharacteristic(this.platform.Characteristic.On)
          .onSet(this.setOn.bind(this));

        const cachedState = this.storage.getItemSync(this.accessory.context.device.name);
        if ((cachedState === undefined) || (cachedState === false)) {
          this.service.setCharacteristic(this.platform.Characteristic.On, false);
          this.state = false;
        } else {
          this.service.setCharacteristic(this.platform.Characteristic.On, true);
          this.state = true;
        }
    }

    async setOn(value: CharacteristicValue, context) {
      const on = value as boolean;
      if (this.sensor) {
        switch (this.accessory.context.device.sensorType) {
          case 'contact':
            this.sensor.setCharacteristic(this.platform.Characteristic.ContactSensorState, (on ? 1 : 0));
            break;
          case 'motion':
            this.sensor.setCharacteristic(this.platform.Characteristic.MotionDetected, (on ? 1 : 0));
            break;
          case 'occupancy':
            this.sensor.setCharacteristic(this.platform.Characteristic.OccupancyDetected, (on ? 1 : 0));
            break;
          default:
            break;
        }
      }

      if (this.state === on) {
        this.service.getCharacteristic(this.platform.Characteristic.On)
          .emit('change', {
            oldValue: on,
            newValue: on,
            reason: ChangeReason.EVENT,
            context: context,
          });
      } else {
        this.platform.log.info(
          'Setting',
          this.accessory.context.device.name,
          '(' + this.accessory.context.device.accessoryType + ')',
          on ? 'On' : 'Off',
        );
      }

      this.storage.setItemSync(this.accessory.context.device.name, on);

      this.state = on;
    }
}
