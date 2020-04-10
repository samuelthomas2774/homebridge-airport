import {EventEmitter} from 'events';
import Client from 'node-acp';
import {DeviceConfiguration, DEFAULT_ACP_PORT} from './configuration';

export enum ClientStatus {
    NOT_CONNECTED = 0,
    CONNECTING = 1,
    AUTHENTICATING = 2,
    ERROR = 3,
    READY = 4,
    DISCONNECTING = 5,
}

export type TargetStatus = ClientStatus.NOT_CONNECTED | ClientStatus.READY;

export default class AirPortBaseStation extends EventEmitter {
    config: DeviceConfiguration;
    client: Client | null = null;
    _status = ClientStatus.NOT_CONNECTED;
    private _target_status: TargetStatus = ClientStatus.NOT_CONNECTED;
    auto_reconnect = false;

    constructor(config: DeviceConfiguration) {
        super();

        this.config = config;
    }

    get status() {
        return this._status;
    }

    connecting = false;
    private _connecting: Promise<Client> | null = null;

    async connect() {
        const promise: Promise<any> = this._disconnecting || this._connecting || Promise.resolve();

        return this._connecting = promise.then(() => this._connect()).then(c => (this._connecting = null, c));
    }

    private async _connect() {
        if (this.client && this.client.connected) {
            this.setCurrentStatus(ClientStatus.READY);
            return this.client;
        }

        const client = new Client(this.config.host, this.config.port || DEFAULT_ACP_PORT, this.config.password);

        this.connecting = true;
        this.setCurrentStatus(ClientStatus.CONNECTING);

        try {
            await client.connect();

            this.setCurrentStatus(ClientStatus.AUTHENTICATING);

            await client.authenticate();
        } catch (err) {
            this.setCurrentStatus(ClientStatus.ERROR);
            this.emit('error', err);
            throw err;
        }

        this.client = client;
        this.setCurrentStatus(ClientStatus.READY);

        return client;
    }

    private _disconnecting: Promise<void> | null = null;

    async disconnect() {
        const promise: Promise<any> = this._connecting || this._disconnecting || Promise.resolve();

        return this._disconnecting = promise.then(() => this._disconnect()).then(v => (this._disconnecting = null, v));
    }

    private async _disconnect() {
        if (!this.client) {
            this.setCurrentStatus(ClientStatus.NOT_CONNECTED);
            return;
        }

        const client = this.client;

        this.setCurrentStatus(ClientStatus.DISCONNECTING);
        this.client = null;

        await client.disconnect();
    }

    _wait_ts: Promise<void> | null = null;

    async waitForTargetStatus() {
        return this._wait_ts || (this._wait_ts = this._waitForTargetStatus().then(v => (this._wait_ts = null, v)));
    }

    private async _waitForTargetStatus() {
        while (this._target_status !== this._status) {
            switch (this._target_status) {
                default:
                    throw new Error('Invalid target state');
                case ClientStatus.NOT_CONNECTED:
                    await this.disconnect();
                case ClientStatus.READY:
                    await this.connect();
            }
        }
    }

    setStatus(status: TargetStatus) {
        console.log('Setting target status for %s to %s', this.config.host, ClientStatus[status]);
        this._target_status = status;
        return this.waitForTargetStatus();
    }

    private setCurrentStatus(status: ClientStatus) {
        console.log('Setting current status for %s to %s', this.config.host, ClientStatus[status]);

        if (this._status === status) return;

        this._status = status;
        this.emit('status', status);

        if (this.auto_reconnect) {
            this.waitForTargetStatus();
        }
    }

    private handleDisconnect() {
        this.setCurrentStatus(ClientStatus.NOT_CONNECTED);
        this.emit('disconnected');
    }
}
