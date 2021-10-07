import { Service, PlatformAccessory, CharacteristicValue, ChangeReason } from 'homebridge';

import { PseudoPlatform } from './platform';

export class PseudoAccessory {
    private cacheDirectory: string;
    private service: Service;
    private contact;
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
            forgiveParseErrors: true
        });

        this.accessory.getService(this.platform.Service.AccessoryInformation)!
            .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Pseudo')
            .setCharacteristic(this.platform.Characteristic.Model, 'Pseudo (' + this.accessory.context.device.accessoryType + ')')
            .setCharacteristic(this.platform.Characteristic.SerialNumber, this.accessory.UUID);

        switch (this.accessory.context.device.accessoryType) {
            case "light":
                this.service = this.accessory.getService(this.platform.Service.Lightbulb) || this.accessory.addService(this.platform.Service.Lightbulb);
                break;
            case "outlet":
                this.service = this.accessory.getService(this.platform.Service.Outlet) || this.accessory.addService(this.platform.Service.Outlet);
                break;
            case "switch":
                this.service = this.accessory.getService(this.platform.Service.Switch) || this.accessory.addService(this.platform.Service.Switch);
                break;
            default:
                this.service = this.accessory.getService(this.platform.Service.Lightbulb) || this.accessory.addService(this.platform.Service.Lightbulb);
                this.platform.log.error("Found Unknown Accessory Type:", this.accessory.context.device.name, "(" + this.accessory.context.device.accessoryType + ")");
                break;
        }

        switch (this.accessory.context.device.sensorType) {
            case "contact":
                this.contact = this.accessory.getService(this.platform.Service.ContactSensor) || this.accessory.addService(this.platform.Service.ContactSensor);
                break;
            default:
                this.platform.log.error("Found Unknown Sensor Type:", this.accessory.context.device.name, "(" + this.accessory.context.device.sensorType + ")");
                break;
        }

        this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.name);

        this.service.getCharacteristic(this.platform.Characteristic.On)
            .onSet(this.setOn.bind(this));

        var cachedState = this.storage.getItemSync(this.accessory.context.device.name);
        if ((cachedState === undefined) || (cachedState === false)) {
            this.service.setCharacteristic(this.platform.Characteristic.On, false);
            this.state = false;
        } else {
            this.service.setCharacteristic(this.platform.Characteristic.On, true);
            this.state = true;
        }
    }

    async setOn(value: CharacteristicValue, context) {
        if (this.contact) {
            this.contact.setCharacteristic(this.platform.Characteristic.ContactSensorState, (value as boolean ? 1 : 0));
        }

        if (this.state === value as boolean) {
            this.service.getCharacteristic(this.platform.Characteristic.On)
                .emit('change', {
                    oldValue: value as boolean,
                    newValue: value as boolean,
                    reason: ChangeReason.EVENT,
                    context: context
                });
        } else {
            this.platform.log.debug("Setting", this.accessory.context.device.name, "(" + this.accessory.context.device.accessoryType + ")", value as boolean ? "On" : "Off");
        }

        this.storage.setItemSync(this.accessory.context.device.name, value as boolean);

        this.state = value as boolean;
    }
}
