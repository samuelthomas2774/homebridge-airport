export default function({Service, Characteristic, Formats, Perms}: typeof import('hap-nodejs')) {
    /**
     * Characteristic "Wi-Fi Satellite Status"
     */

    class WiFiSatelliteStatus extends Characteristic {
        // The value property of WiFiSatelliteStatus must be one of the following:
        static readonly UNKNOWN = 0;
        static readonly CONNECTED = 1;
        static readonly NOT_CONNECTED = 2;
    
        static readonly UUID: string = '0000021E-0000-1000-8000-0026BB765291';
    
        constructor() {
            super('Wi-Fi Satellite Status', WiFiSatelliteStatus.UUID);
            this.setProps({
                format: Formats.UINT8,
                maxValue: 2,
                minValue: 0,
                validValues: [0,1,2],
                perms: [Perms.PAIRED_READ, Perms.EVENTS],
            });
            this.value = this.getDefaultValue();
        }
    }

    /**
     * Service "Wi-Fi Satellite"
     */

    class WiFiSatellite extends Service {
        static readonly UUID: string = '0000020F-0000-1000-8000-0026BB765291';
    
        constructor(displayName?: string, subtype?: string) {
            super(displayName!, WiFiSatellite.UUID, subtype!);
    
            // Required Characteristics
            this.addCharacteristic(WiFiSatelliteStatus);
        }
    }

    /**
     * Characteristic "Wi-Fi Client List"
     */

    class WiFiClientList extends Characteristic {
        static readonly UUID: string = '6535A829-0813-4155-A0CD-760E93430203';
    
        constructor() {
            super('Wi-Fi Client List', WiFiClientList.UUID);
            this.setProps({
                format: Formats.DICTIONARY,
                maxLen: 5000,
                perms: [Perms.PAIRED_READ, Perms.EVENTS],
            });
            this.value = this.getDefaultValue();
        }
    }

    /**
     * Characteristic "Full Wi-Fi Client List"
     */

    class FullWiFiClientList extends Characteristic {
        static readonly UUID: string = '6535A82A-0813-4155-A0CD-760E93430203';
    
        constructor() {
            super('Full Wi-Fi Client List', FullWiFiClientList.UUID);
            this.setProps({
                format: Formats.DICTIONARY,
                maxLen: 5000,
                perms: [Perms.PAIRED_READ, Perms.EVENTS],
            });
            this.value = this.getDefaultValue();
        }
    }

    /**
     * Service "Wi-Fi Clients"
     */

    class WiFiClients extends Service {
        static readonly UUID: string = '6535A828-0813-4155-A0CD-760E93430203';
    
        constructor(displayName?: string, subtype?: string) {
            super(displayName!, WiFiClients.UUID, subtype!);
    
            // Required Characteristics
            this.addCharacteristic(WiFiClientList);

            // Optional Characteristics
            this.addOptionalCharacteristic(FullWiFiClientList);
        }
    }

    return {
        WiFiSatelliteStatus,
        WiFiSatellite,

        WiFiClientList,
        FullWiFiClientList,
        WiFiClients,
    } as any;
}

// @ts-ignore
return;

import {Service, Characteristic} from 'hap-nodejs';

declare class WiFiSatelliteStatus extends Characteristic {
    // The value property of WiFiSatelliteStatus must be one of the following:
    static readonly UNKNOWN = 0;
    static readonly CONNECTED = 1;
    static readonly NOT_CONNECTED = 2;

    static readonly UUID = '0000021E-0000-1000-8000-0026BB765291';

    constructor();
}

declare class WiFiSatellite extends Service {
    static readonly UUID = '0000020F-0000-1000-8000-0026BB765291';

    constructor(displayName?: string, subtype?: string);
}

declare class WiFiClientList extends Characteristic {
    static readonly UUID = '6535A829-0813-4155-A0CD-760E93430203';

    constructor();
}

/**
 * Characteristic "Full Wi-Fi Client List"
 */

declare class FullWiFiClientList extends Characteristic {
    static readonly UUID = '6535A82A-0813-4155-A0CD-760E93430203';

    constructor();
}

/**
 * Service "Wi-Fi Clients"
 */

declare class WiFiClients extends Service {
    static readonly UUID = '6535A828-0813-4155-A0CD-760E93430203';

    constructor(displayName?: string, subtype?: string);
}

export type Namespaces = {
    WiFiSatelliteStatus: typeof WiFiSatelliteStatus;
    WiFiSatellite: typeof WiFiSatellite;

    WiFiClientList: typeof WiFiClientList;
    FullWiFiClientList: typeof FullWiFiClientList;
    WiFiClients: typeof WiFiClients;
};
export type Types = {
    WiFiSatelliteStatus: WiFiSatelliteStatus;
    WiFiSatellite: WiFiSatellite;

    WiFiClientList: WiFiClientList;
    FullWiFiClientList: FullWiFiClientList;
    WiFiClients: WiFiClients;
};
