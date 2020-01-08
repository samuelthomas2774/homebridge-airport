homebridge-airport
===

Homebridge plugin for Apple AirPort base stations. Currently only supports monitoring Wi-Fi clients.

```
# From registry.npmjs.com
npm install --global homebridge-airport

# From npm.pkg.github.com
npm install --global --registry https://npm.pkg.github.com @samuelthomas2774/homebridge-airport
```

```json
{
    "platform": "airport.AirPort",
    "devices": {
        "AirPort Extreme": {
            "host": "airport-extreme.local",
            "password": "password"
        }
    },
    "accessories": [
        {
            "type": "connected-clients",
            "name": "Wi-Fi Network In Use",
            "stations": "all",
            "exclude-clients": [
                "00:00:00:00:00:00"
            ]
        }
    ]
}
```

#### TODO

- Use a monitoring session instead of polling connected clients
- HomeKit Accessory Security

Configuration
---

### AirPort base station connections

The `devices` object maps names of AirPort base stations to their host/IP address and admin password.

```json
{
    "AirPort Extreme": {
        "host": "airport-extreme.local",
        "password": "password"
    }
}
```

You can also add the port number if it's different for any reason (e.g. when using port forwarding to access remote
base stations), and disable the default base station accessory.

```json
{
    "AirPort Extreme": {
        "host": "airport-extreme.local",
        "password": "password",
        "port": 5009,
        "accessory": false
    }
}
```

### Accessories

The `accessories` array contains a list of accessories to publish in Homebridge, with a `type` property and
type-specific configuration.

#### AirPort base station

Accessories for each AirPort base station are automatically added (unless they are explicitly configured or the
default base station accessory is disabled).

`type` must be `"base-station"` and `id` is the key for the base station in the `devices` object.

```json
{
    "type": "base-station",
    "id": "AirPort Extreme"
}
```

To add an occupancy sensor that detects Wi-Fi clients, set the `connected-clients` property. 

```json
{
    "type": "base-station",
    "id": "AirPort Extreme",
    "connected-clients": [
        {
            "stations": [
                "all"
            ],
            "clients": [...],
            "exclude-clients": [...]
        }
    ]
}
```

#### Occupancy sensor

Adds an occupancy sensor that detects Wi-Fi clients.

```json
{
    "type": "connected-clients",
    "name": "Wi-Fi Network In Use",
    "stations": [
        ["AirPort Extreme", "main"]
    ],
    "exclude-clients": [
        "00:00:00:00:00:00"
    ]
}
```

You can also whitelist clients to detect instead of excluding known clients.

```json
{
    "type": "connected-clients",
    "name": "Wi-Fi Network In Use",
    "stations": [
        ["AirPort Extreme", "main"]
    ],
    "clients": [
        "00:00:00:00:00:00"
    ]
}
```
