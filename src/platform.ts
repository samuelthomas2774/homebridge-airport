import AirPortBaseStation from './airport';
import {Configuration, DeviceIdentifier} from './configuration';
import Accessory, {BaseStationAccessory, types} from './accessories';

export default class AirPort {
    readonly hap: typeof import('hap-nodejs');
    readonly custom: typeof import('./custom-hap').CustomHapTypes;

    readonly config: Readonly<Configuration>;
    readonly clients: Record<DeviceIdentifier, AirPortBaseStation> = {};
    readonly accessories: Accessory[] = [];

    constructor(config: Readonly<Configuration>, hap?: typeof import('hap-nodejs')) {
        this.hap = hap || require('hap-nodejs');
        this.custom = require('./custom-hap').default(this.hap);
        this.config = config;

        for (const [identifier, deviceconfig] of Object.entries(config.devices || {})) {
            this.clients[identifier] = new AirPortBaseStation(deviceconfig);
        }

        if (!Object.keys(this.clients).length) {
            console.warn('No configured AirPort base stations');
        }

        for (const accessoryconfig of config.accessories || []) {
            try {
                const constructor = types[accessoryconfig.type] as any;

                const accessory = constructor.fromConfig(this, accessoryconfig);

                this.accessories.push(accessory);
            } catch (err) {
                console.error('Error loading accessory', err);
            }
        }

        for (const [identifier, client] of Object.entries(this.clients)) {
            if (this.accessories.find(a => a instanceof BaseStationAccessory && a.basestation === client)) continue;
            if ('accessory' in client.config && !client.config.accessory) continue;
            this.accessories.push(new BaseStationAccessory(this, client, identifier));
        }

        if (!this.accessories.length) {
            console.warn('No configured AirPort accessories');
        }
    }

    async getAccessories() {
        const accessories: Accessory[] = [];

        for (const accessory of this.accessories) {
            try {
                await accessory.wait_ready;
                accessories.push(accessory);
            } catch (err) {
                console.error('Error loading accessory', err);
            }
        }

        return accessories;
    }
}
