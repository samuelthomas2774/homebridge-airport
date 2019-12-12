import AirPort from '../platform';
import {Configuration} from '../configuration';
import {Accessory, Service, Characteristic} from 'hap-nodejs';

type Logger = typeof console & typeof console.log;
type AccessoryConstructor = any;
type PlatformConstructor = {new (log: Logger, config: any, homebridge: HomebridgeAPI): Platform};

interface Platform {
    accessories(callback: (accessories: Accessory[]) => void): void;
}

interface HomebridgeAPI {
    hap: typeof import('hap-nodejs');
    user: HomebridgeUser,
    registerAccessory(plugin: string, type: string, accessory: AccessoryConstructor): void;
    registerPlatform(plugin: string, type: string, platform: PlatformConstructor): void;
    publishExternalAccessories(): never; // TODO
    platformAccessory: typeof Accessory;
}

interface HomebridgeUser {
    config(): HomebridgeConfiguration;
    storagePath(): string;
    configPath(): string;
    persistPath(): string;
    cachedAccessoryPath(): string;
}

interface HomebridgeConfiguration {}

function initHomebridge(homebridge: HomebridgeAPI, log: Logger) {
    homebridge.registerPlatform('airport', 'AirPort', AirPortPlatform);
}

export default initHomebridge;

class AirPortPlatform implements Platform {
    readonly homebridge: HomebridgeAPI;
    readonly platform: AirPort;

    constructor(log: Logger, config: Configuration, homebridge: HomebridgeAPI) {
        this.homebridge = homebridge;
        this.platform = new AirPort(config, homebridge.hap);
    }

    accessories(callback: (accessories: Accessory[]) => void) {
        this.platform.getAccessories().then(accessories => {
            const {Service, Characteristic} = this.platform.hap;

            callback(accessories.map(accessory => {
                const platformAccessory = new this.homebridge.platformAccessory(accessory.name!, accessory.uuid);

                const accessory_information = platformAccessory.getService(Service.AccessoryInformation) ||
                    platformAccessory.addService(Service.AccessoryInformation);
                accessory_information.setCharacteristic(Characteristic.Manufacturer, accessory.manufacturer!);
                accessory_information.setCharacteristic(Characteristic.Model, accessory.model!);
                accessory_information.setCharacteristic(Characteristic.SerialNumber, accessory.serial_number!);
                accessory_information.setCharacteristic(Characteristic.FirmwareRevision, accessory.firmware_revision!);

                for (const service of accessory.services) platformAccessory.addService(service);

                return platformAccessory;
            }));
        });
    }
}
