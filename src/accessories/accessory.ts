import AirPort from '../platform';
import {BaseAccessoryConfiguration} from '../configuration';
import {Service} from 'hap-nodejs';

export default abstract class Accessory {
    platform: AirPort;

    wait_ready: Promise<void> | null = new Promise((rs, rj) => this.ready_callback = err => {
        this.wait_ready = null;
        err ? rj(err) : rs();
        if (!err) console.log('Accessory %s (%s) ready', this.name, this.uuid);
        if (err) console.error('Accessory %s (%s) errored', this.name, this.uuid, err);
    });
    ready_callback!: (err?: Error) => void;

    get ready() {return !this.wait_ready;}
    set ready(ready) {ready && this.ready_callback();}

    readonly uuid: string;
    readonly name: string | null = null;
    readonly model: string | null = null;
    readonly manufacturer: string | null = null;
    readonly serial_number: string | null = null;
    readonly firmware_revision: string | null = null;
    readonly services: Service[] = [];

    constructor(platform: AirPort, uuid: string) {
        this.platform = platform;
        this.uuid = uuid;
    }

    static fromConfig<T extends Accessory, C extends {new (...args: any): T;}>(this: C, platform: AirPort, config: Readonly<BaseAccessoryConfiguration>): T {
        throw new Error('Accessory didn\'t override fromConfig');
    }
}
