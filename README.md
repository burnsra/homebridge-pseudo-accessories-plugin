# "Pseudo Accessories" Plugin

This code is heavily based on the work of Ed Coen's [homebridge-dummy-contact](https://github.com/ecoen66/homebridge-dummy-contact) accessory, Nick Farina's [homebridge-dummy](https://github.com/nfarina/homebridge-dummy) accessory, and that of [NorthernMan54](https://github.com/NorthernMan54/).

With this plugin, you can create any number of pseudo accessories that can be very useful for advanced automation with HomeKit scenes.

Accessory Types:
- Light
- Outlet
- Switch

Sensor Types:
- Contact
- Motion
- Occupancy

Example config.json:
```
    {
        "name": "Pseudo",
        "debug": false,
        "accessories": [
            {
                "name": "Test Light",
                "accessoryType": "light",
                "sensorType": "contact"
            },
            {
                "name": "Test Switch",
                "accessoryType": "switch"
            },
            {
                "name": "Test outlet",
                "accessoryType": "outlet",
                "sensorType": "motion"
            }
        ],
        "platform": "Pseudo"
    }
```