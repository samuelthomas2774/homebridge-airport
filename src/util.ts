declare class AsyncFunction extends Function {}
interface AsyncFunction {
    (...args: any[]): Promise<any>;
}

interface CallbackifyOptions {
    arguments?: number;
}

export function callbackifyGetHandler<K extends string, T, Ta = {
    [N in K]: ((context?: any, connection_id?: string) => Promise<T>) |
        ((callback: (err?: Error, value?: T) => void, context?: any, connection_id?: string) => void);
}>(target: Ta, key: K, descriptor: PropertyDescriptor): void
export function callbackifyGetHandler<K extends string, T, Ta = {
    [N in K]: ((context?: any, connection_id?: string) => Promise<T>) |
        ((callback: (err?: Error, value?: T) => void, context?: any, connection_id?: string) => void);
}>(options: CallbackifyOptions, target: Ta, key: K, descriptor: PropertyDescriptor): void
export function callbackifyGetHandler<K extends string, T, Ta = {
    [N in K]: ((context?: any, connection_id?: string) => Promise<T>) |
        ((callback: (err?: Error, value?: T) => void, context?: any, connection_id?: string) => void);
}>(...args: any[]) {
    const [options, target, key, descriptor] = typeof args[1] === 'string' ?
        [{} as CallbackifyOptions, args[0] as Ta, args[1] as K, args[2] as PropertyDescriptor] :
        [args[0] as CallbackifyOptions, args[1] as Ta, args[2] as K, args[3] as PropertyDescriptor];
    const handler = descriptor.value;

    if (isAsyncFunction(handler)) {
        const numargs = options.arguments || 0;
        descriptor.value = function(callback: (err?: Error, value?: T) => void, ...args: any[]) {
            args = [...arguments];
            callback = args[numargs];
            handler.call(this, ...args.slice(0, numargs), ...args.slice(numargs))
                .then((v: any) => callback(undefined, v), callback);
        };
    }
}

callbackifyGetHandler.options = function(options: CallbackifyOptions): <K extends string, T, Ta = {
    [N in K]: ((context?: any, connection_id?: string) => Promise<T>) |
        ((callback: (err?: Error, value?: T) => void, context?: any, connection_id?: string) => void);
}>(target: Ta, key: K, descriptor: PropertyDescriptor) => void {
    return callbackifyGetHandler.bind(null, options);
};

export function callbackifySetHandler<K extends string, T, Ta = {
    [N in K]: ((context?: any, connection_id?: string) => Promise<T>) |
        ((value: T, callback: (err?: Error, value?: T) => void, context?: any, connection_id?: string) => void);
}>(target: Ta, key: K, descriptor: PropertyDescriptor): void
export function callbackifySetHandler<K extends string, T, Ta = {
    [N in K]: ((context?: any, connection_id?: string) => Promise<T>) |
        ((value: T, callback: (err?: Error, value?: T) => void, context?: any, connection_id?: string) => void);
}>(options: CallbackifyOptions, target: Ta, key: K, descriptor: PropertyDescriptor): void
export function callbackifySetHandler<K extends string, T, Ta = {
    [N in K]: ((value: T, context?: any, connection_id?: string) => Promise<T>) |
        ((value: T, callback: (err?: Error, value?: T) => void, context?: any, connection_id?: string) => void);
}>(...args: any[]) {
    const [options, target, key, descriptor] = typeof args[1] === 'string' ?
        [{} as CallbackifyOptions, args[0] as Ta, args[1] as K, args[2] as PropertyDescriptor] :
        [args[0] as CallbackifyOptions, args[1] as Ta, args[2] as K, args[3] as PropertyDescriptor];
    const handler = descriptor.value;

    if (isAsyncFunction(handler)) {
        const numargs = options.arguments || 0;
        descriptor.value = function(value: T, callback: (err?: Error, value?: T) => void, ...args: any[]) {
            args = [...arguments];
            callback = args[numargs];
            handler.call(this, value, ...args.slice(0, numargs), ...args.slice(numargs + 1))
                .then((v: T) => callback(undefined, v), callback);
        };
    }
}

callbackifySetHandler.options = function(options: CallbackifyOptions): <K extends string, T, Ta = {
    [N in K]: ((context?: any, connection_id?: string) => Promise<T>) |
        ((value: T, callback: (err?: Error, value?: T) => void, context?: any, connection_id?: string) => void);
}>(target: Ta, key: K, descriptor: PropertyDescriptor) => void {
    return callbackifySetHandler.bind(null, options);
};

function isAsyncFunction(f: any): f is AsyncFunction {
    if (!f) return false;
    if (f.toString().startsWith('async ')) return true;

    const match = f.toString().match(/(function)? .*\n?(\s*if ?\(([a-z0-9_]+) ?=== ?void 0\) ?{? ?([a-z0-9_]+) ?= ?(false|\!1);? ?}?\n?)*\s*return __awaiter\(/);
    return !!match;
}

/**
 * Joins a string like "Item 1, Item 2 and Item 3".
 *
 * @param {string[]} items
 */
export function readableJoin(items: string[]) {
    if (items.length <= 1) return items.join('');
    if (items.length <= 2) return items.join(' and ');

    return items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1];
}
