export interface Configuration {
    devices: Record<DeviceIdentifier, DeviceConfiguration>;
    accessories: AccessoryConfiguration[];
}

export type DeviceIdentifier = string;

export interface DeviceConfiguration {
    host: string;
    port?: number;
    password: string;
    encryption?: boolean;
}

export const DEFAULT_ACP_PORT = 5009;

export interface BaseAccessoryConfiguration {
    type: string;
}

export interface BaseStationConfiguration extends BaseAccessoryConfiguration {
    type: 'base-station';
    id: DeviceIdentifier;
    'connected-clients'?: (ConnectedClientsConfiguration & {
        type?: any;
        stations: 'all' | NetworkInterfaceGroup | (NetworkInterface | NetworkInterfaceGroup)[];
    })[];
}

export type NetworkInterfaceGroup = 'main' | 'guest';
/** wlan0, wlan1, etc... */
export type NetworkInterface = string;
export type MACAddress = string;

export interface ConnectedClientsConfiguration extends BaseAccessoryConfiguration {
    type: 'connected-clients';
    name: string;
    stations: 'all' | NetworkInterfaceGroup | (DeviceIdentifier | [DeviceIdentifier, NetworkInterface | NetworkInterfaceGroup])[];
    clients?: MACAddress[];
    'exclude-clients'?: MACAddress[];
}

export type AccessoryConfigurationTypes = {
    'base-station': BaseStationConfiguration;
    'connected-clients': ConnectedClientsConfiguration;
}

export type AccessoryConfiguration = AccessoryConfigurationTypes[keyof AccessoryConfigurationTypes];
