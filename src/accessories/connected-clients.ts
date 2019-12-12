import Accessory from './accessory';
import AirPortBaseStation, {ClientStatus} from '../airport';
import AirPort from '../platform';
import {ConnectedClientsConfiguration, MACAddress} from '../configuration';
import {Property, PropertyValueTypes} from 'node-acp';
import {callbackifyGetHandler, readableJoin} from '../util';

export default class ConnectedClientsAccessory extends Accessory {
    readonly basestations: [AirPortBaseStation, string | null][];
    readonly clients: MACAddress[] | null;
    readonly exclude_clients: MACAddress[];

    readonly name: string;
    readonly manufacturer = 'Samuel Elliott';
    readonly model = 'AirPort, connected devices';
    readonly serial_number: string = 'N/A';
    readonly firmware_revision = require('../../package').version;

    readonly ready = true;

    constructor(
        public platform: AirPort, name: string, basestations: [AirPortBaseStation, string | null][],
        clients: MACAddress[] | null, exclude: MACAddress[]
    ) {
        super(platform, platform.hap.uuid.generate('homebridge-airport:connected-clients:' + name));
        this.name = name;
        this.basestations = basestations;
        this.clients = clients;
        this.exclude_clients = exclude;

        this.serial_number = readableJoin([...new Set(basestations.map(b => b[0]))].map(b => b.config.host));

        for (const [basestation] of this.basestations) {
            basestation.setStatus(ClientStatus.READY);
        }

        this.occupancy_sensor_service.setCharacteristic(this.platform.hap.Characteristic.Name, name);

        this.services.push(this.occupancy_sensor_service);
    }

    static fromConfig<T extends Accessory, C extends {new (...args: any): T;}>(this: C, platform: AirPort, config: Readonly<ConnectedClientsConfiguration>): T {
        const basestations: [AirPortBaseStation, string | null][] = [];

        if (config.stations === 'all') {
            for (const [id, client] of Object.entries(platform.clients)) basestations.push([client, null]);
        } else if (config.stations === 'main') {
            for (const [id, client] of Object.entries(platform.clients)) basestations.push([client, 'main']);
        } else if (config.stations === 'guest') {
            for (const [id, client] of Object.entries(platform.clients)) basestations.push([client, 'guest']);
        } else for (const s of config.stations || []) {
            const id = typeof s === 'string' ? s : s[0];
            if (!platform.clients[id]) throw new Error('Unknown AirPort base station');
            basestations.push([platform.clients[id], typeof s === 'string' ? null : s[1]]);
        }

        const accessory = new this(
            platform, config.name, basestations,
            config.clients ? config.clients.map(m => m.toLowerCase()) : null,
            (config['exclude-clients'] || []).map(m => m.toLowerCase())
        );

        return accessory;
    }

    readonly occupancy_sensor_service = (() => {
        // @ts-ignore
        const service = new this.platform.hap.Service.OccupancySensor('Wi-Fi clients');

        service.getCharacteristic(this.platform.custom.WiFiClientList)!
            .on('get', this._handleGetClientList.bind(this, false))
            .on('subscribe', this._handleSubscribeClientList.bind(this, false))
            .on('unsubscribe', this._handleUnsubscribeClientList.bind(this, false));

        service.getCharacteristic(this.platform.custom.FullWiFiClientList)!
            .on('get', this._handleGetClientList.bind(this, true))
            .on('subscribe', this._handleSubscribeClientList.bind(this, true))
            .on('unsubscribe', this._handleUnsubscribeClientList.bind(this, true));

        service.getCharacteristic(this.platform.hap.Characteristic.OccupancyDetected)!
            .on('get', this._handleGetOccupancyDetected.bind(this))
            .on('subscribe', this._handleSubscribeOccupancyDetected.bind(this))
            .on('unsubscribe', this._handleUnsubscribeOccupancyDetected.bind(this));

        return service;
    })();

    @callbackifyGetHandler.options({arguments: 1})
    async _handleGetClientList(all = false) {
        const clients = (all ? await this.getAllConnectedClients() : await this.getConnectedClients()).sort();
        return {clients};
    }

    _clientListPollInterval: NodeJS.Timeout | null = null;
    _fullClientListPollInterval: NodeJS.Timeout | null = null;

    _handleSubscribeClientList(all = false) {
        clearInterval(all ? this._fullClientListPollInterval! : this._clientListPollInterval!);
        this[all ? '_fullClientListPollInterval' : '_clientListPollInterval'] = setInterval(async () => {
            const clients = (all ? await this.getAllConnectedClients() : await this.getConnectedClients()).sort();
            const c = this.occupancy_sensor_service.getCharacteristic(all ?
                this.platform.custom.FullWiFiClientList : this.platform.custom.WiFiClientList)!;
            if (JSON.stringify({clients}) !== JSON.stringify(c.value)) c.updateValue({clients});
        }, 1000);
    }

    _handleUnsubscribeClientList(all = false) {
        clearInterval(all ? this._fullClientListPollInterval! : this._clientListPollInterval!);
    }

    @callbackifyGetHandler
    async _handleGetOccupancyDetected() {
        const clients = await this.getConnectedClients();
        return clients.length ? this.platform.hap.Characteristic.OccupancyDetected.OCCUPANCY_DETECTED :
            this.platform.hap.Characteristic.OccupancyDetected.OCCUPANCY_NOT_DETECTED;
    }

    _occupancyDetectedPollInterval: NodeJS.Timeout | null = null;

    _handleSubscribeOccupancyDetected() {
        clearInterval(this._occupancyDetectedPollInterval!);
        this._occupancyDetectedPollInterval = setInterval(async () => {
            const clients = await this.getConnectedClients();
            this.occupancy_sensor_service.getCharacteristic(this.platform.hap.Characteristic.OccupancyDetected)!
                .updateValue(clients.length ? this.platform.hap.Characteristic.OccupancyDetected.OCCUPANCY_DETECTED :
                    this.platform.hap.Characteristic.OccupancyDetected.OCCUPANCY_NOT_DETECTED);
        }, 1000);
    }

    _handleUnsubscribeOccupancyDetected() {
        clearInterval(this._occupancyDetectedPollInterval!);
    }

    getBaseStations() {
        const basestations = new Map<AirPortBaseStation, string[] | null>();

        for (const [basestation, i] of this.basestations) {
            if (!i) {
                basestations.set(basestation, null);
                continue;
            }

            if (!basestations.has(basestation)) basestations.set(basestation, []);

            const interfaces: string[] | null = basestations.get(basestation)!;

            if (interfaces) interfaces.push(i);
        }

        return basestations;
    }

    async getAllConnectedClients() {
        const basestations = this.getBaseStations();
        const macaddresses: MACAddress[] = [];

        const list_properties = await Promise.all([...basestations.keys()].map(b => {
            if (!b.client) throw new Error('Not connected to AirPort base station');
            return b.client.getProperties(['raSL']).then(p => [b, p[0]] as [AirPortBaseStation, Property<'raSL'>]);
        }));

        const lists: [AirPortBaseStation, PropertyValueTypes.raSL][] =
            list_properties.map(([b, p]) => [b, p.format()!]);

        for (const [basestation, clientlists] of lists) {
            const interfaces: string[] | null = basestations.get(basestation)!;

            for (const [i, clients] of Object.entries(clientlists)) {
                if (interfaces && !interfaces.includes(i) &&
                    !(interfaces.includes('main') && isMainNetwork(i, Object.keys(clientlists))) &&
                    !(interfaces.includes('guest') && isGuestNetwork(i, Object.keys(clientlists)))
                ) continue;

                for (const client of clients) {
                    const macaddress = client.macAddress.toLowerCase();

                    if (macaddresses.includes(macaddress)) continue;

                    macaddresses.push(macaddress);
                }
            }
        }

        return macaddresses;
    }

    async getConnectedClients() {
        const clients = await this.getAllConnectedClients();
        return clients.filter(macaddress => {
            if (this.exclude_clients.includes(macaddress)) return false;
            if (this.clients && !this.clients.includes(macaddress)) return false;

            return true;
        });
    }
}

function isMainNetwork(i: string, interfaces: string[]) {
    const match = i.match(/^wlan([0-9]+)$/i);
    if (!match) return false;
    const iid = parseInt(match[1]);
    return iid === 0 || iid === interfaces.length / 2;
}

function isGuestNetwork(i: string, interfaces: string[]) {
    return !!i.match(/^wlan[0-9]+$/i) && !isMainNetwork(i, interfaces);
}
