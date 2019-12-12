import Accessory from './accessory';
export default Accessory;

import BaseStationAccessory from './base-station';
import ConnectedClientsAccessory from './connected-clients';

export {
    BaseStationAccessory,
    ConnectedClientsAccessory,
};

export const types = {
    'base-station': BaseStationAccessory,
    'connected-clients': ConnectedClientsAccessory,
};
