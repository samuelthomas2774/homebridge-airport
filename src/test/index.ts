import path from 'path';
import fs from 'fs';
// @ts-ignore
import storage from 'node-persist';
import * as hap from 'hap-nodejs';
import {Bridge, Accessory, Service, Characteristic, uuid} from 'hap-nodejs';
import yaml from 'yaml';

import homebridge_plugin from '..';

const config_path = path.resolve(process.cwd(), process.argv[2] || 'config');
const config = (() => {
    try {
        const data = fs.readFileSync(config_path, 'utf-8');
        try {
            return yaml.parse(data);
        } catch (err) {
            return JSON.parse(data);
        }
    } catch (err) {try {
        const data = fs.readFileSync(config_path + '.yaml', 'utf-8');
        return yaml.parse(data);
    } catch (err) {
        const data = fs.readFileSync(config_path + '.json', 'utf-8');
        return JSON.parse(data);
    }}
})();

const bridge_config = {
    port: 51826,
    username: 'A3:FB:3D:4D:2E:AD',
    pincode: '031-45-154',
    category: Accessory.Categories.ROUTER,
};

const homebridge_config = {
    bridge: bridge_config,
    platforms: [config],
};

const log = function (...args: any[]) {
    console.log(...args);
} as typeof console & typeof console.log;
Object.setPrototypeOf(log, console);

type AccessoryConstructor = any;
type PlatformConstructor = {new (_log: typeof log, config: any, homebridge: typeof homebridge_api): Platform};
interface Platform {
    accessories(callback: (accessories: Accessory[]) => void): void;
}

const platform_types: Record<string, PlatformConstructor> = {};

const homebridge_api = {
    hap,
    user: {
        config: () => homebridge_config,
        storagePath: () => path.resolve(__dirname, '..'),
        configPath: () => path.resolve(__dirname, 'config.json'),
        persistPath: () => path.resolve(__dirname, '..', 'persist'),
        cachedAccessoryPath: () => path.resolve(__dirname, '..', 'accessories'),
    },
    registerAccessory: (plugin: string, type: string, accessory: AccessoryConstructor) => {
        // Not supported
    },
    registerPlatform: (plugin: string, type: string, platform: PlatformConstructor) => {
        platform_types[plugin + '.' + type] = platform_types[type] = platform;
    },
    publishExternalAccessories: () => {
        throw new Error('External accessories are not supported');
    },
    platformAccessory: Accessory,
};

homebridge_plugin(homebridge_api, log);

if (!platform_types[config.platform]) {
    throw new Error('Unknown platform "' + config.platform + '"');
}

(async () => {
    const platform_instance = new platform_types[config.platform](log, config, homebridge_api);
    const accessories = await new Promise<Accessory[]>(rs => platform_instance.accessories(rs));

    const bridge_uuid = uuid.generate('hap-nodejs:bridge');
    const bridge = new Bridge(config.name, bridge_uuid);
    bridge.category = Accessory.Categories.BRIDGE;

    storage.initSync({
        dir: path.resolve(__dirname, '..', '..', 'persist'),
        stringify: (data: string) => JSON.stringify(data, undefined, 4) + '\n',
    });

    for (const accessory of accessories) {
        bridge.addBridgedAccessory(accessory);
    }

    // Publish this Accessory on the local network
    bridge.publish(bridge_config, true);

    console.log('Listening on port', bridge_config.port);
    console.log('Setup code is', bridge_config.pincode);

    for (let [signal, id] of Object.entries({SIGINT: 2, SIGTERM: 15}) as [NodeJS.Signals, number][]) {
        process.on(signal, () => {
            console.log('Shutting down');
            bridge.unpublish();
            setTimeout(() => process.exit(128 + id), 1000);
        });
    }
})();
