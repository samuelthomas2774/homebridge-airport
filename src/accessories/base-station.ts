import Accessory from './accessory';
import AirPortBaseStation, {ClientStatus} from '../airport';
import AirPort from '../platform';
import {CustomHapTypes} from '../custom-hap';
import {BaseStationConfiguration, ConnectedClientsConfiguration} from '../configuration';
import {Property} from 'node-acp';
import {CharacteristicEventTypes} from 'hap-nodejs';
import {callbackifyGetHandler} from '../util';
import ConnectedClientsAccessory from './connected-clients';

export default class BaseStationAccessory extends Accessory {
    readonly basestation: AirPortBaseStation;

    readonly name: string;
    readonly manufacturer = 'Apple, Inc.';

    constructor(
        platform: AirPort, basestation: AirPortBaseStation, identifier: string,
        connected_clients?: (ConnectedClientsConfiguration & {
            type?: any; stations: 'all' | 'main' | 'guest' | string[];
        })[]
    ) {
        super(platform, platform.hap.uuid.generate('homebridge-airport:base-station:' + identifier));
        this.basestation = basestation;
        this.name = identifier;

        this.basestation.setStatus(ClientStatus.READY);
        this.basestation.auto_reconnect = true;
        this.basestation.connect().then(async () => {
            const [name, model, serial, version, wifi] =
                await this.basestation.client!.getProperties(['syNm', 'syAM', 'sySN', 'syVs', 'WiFi']) as [
                    Property<'syNm'>, Property<'syAM'>, Property<'sySN'>, Property<'syVs'>, Property<'WiFi'>
                ];
            
            // @ts-ignore
            this.name = name.format();
            // @ts-ignore
            this.model = model.format();
            // @ts-ignore
            this.serial_number = serial.format();
            // @ts-ignore
            this.firmware_revision = version.format();

            const wifi_configuration = wifi.format()!;

            this.wifi_satellite_service.getCharacteristic(this.platform.hap.Characteristic.Name)!
                .updateValue(wifi_configuration.radios[0].raNm);

            this.services.push(this.wifi_satellite_service);

            for (const config of connected_clients || []) {
                const accessory = new ConnectedClientsAccessory(
                    platform, 'Wi-Fi Network In Use',
                    config.stations === 'all' ? [[basestation, null]] :
                        config.stations === 'main' ? [[basestation, 'main']] :
                        config.stations === 'guest' ? [[basestation, 'guest']] :
                        // @ts-ignore
                        config.stations.map(i => [basestation, i]),
                    config.clients ? config.clients.map(m => m.toLowerCase()) : null,
                    (config['exclude-clients'] || []).map(m => m.toLowerCase())
                );

                this.services.push(...accessory.services);
            }
        }).then(() => this.ready_callback(), this.ready_callback);
    }

    static fromConfig<T extends Accessory, C extends {new (...args: any): T;}>(this: C, platform: AirPort, config: Readonly<BaseStationConfiguration>): T {
        const basestation = platform.clients[config.id];
        if (!basestation) throw new Error('Unknown base station');

        const accessory = new this(platform, basestation, config.id, config['connected-clients']);

        return accessory;
    }

    readonly wifi_satellite_service: CustomHapTypes.WiFiSatellite = (() => {
        const service = new this.platform.custom.WiFiSatellite('Wi-Fi Network');

        service.getCharacteristic(this.platform.custom.WiFiSatelliteStatus)!
            .on('get' as CharacteristicEventTypes, this._handleGetWiFiSatelliteStatus.bind(this))
            .updateValue(this.platform.custom.WiFiSatelliteStatus.CONNECTED);

        return service;
    })();

    @callbackifyGetHandler
    async _handleGetWiFiSatelliteStatus() {
        return this.platform.custom.WiFiSatelliteStatus.CONNECTED;
    }
}
