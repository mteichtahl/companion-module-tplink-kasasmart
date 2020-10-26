var instance_skel = require('../../instance_skel');
const { Client } = require('tplink-smarthome-api');
const _ = require('lodash')

const ACTIONS = {
    ON_ACTION: 'ON_ACTION',
    OFF_ACTION: 'OFF_ACTION'
}

class instance extends instance_skel {

    constructor(system, id, config) {
        super(system, id, config);

        var self = this;

        self._devices = {};
        self.actions()

        return self;
    }

    async init() {
        var self = this;

        try {
            self._devices = await self._discoverDevices();
            _(self.devices).forEach(device => self.log('info', `Discovered ${device.alias}`))
            if (_.size(self._devices)) {
                self.actions();
                self.status(self.STATE_OK, `(${_.size(self._devices)} devices)`);
            } else {
                self.status(self.STATUS_WARNING, `(No devices discovered)`);
            }
        } catch (e) {
            self.status(self.STATUS_ERROR, `Error ${e}`);
            self.log('error', `Error ${e}`)
        }

    }

    config_fields() {
        var self = this;
        let fields = []

        _(self._devices).forEach(device => {
            fields.push(
                {
                    type: 'text',
                    id: `${device.alias}_label`,
                    width: 10,
                    label: `${device.alias}`,
                    value: `${device.model} - ${device.name}`
                }
            )
        })

        return fields;

    }

    updateConfig(config) {
        console.log('updateConfig')

        var self = this;

        self.config = config;


    }

    actions() {
        var self = this;

        const defaultDeviceId = Object.keys(self._devices)[0];

        var actions = {
            'ON_ACTION': {
                label: 'Turn a device on',
                options: [
                    {
                        type: 'dropdown',
                        label: 'Device',
                        id: 'deviceId',
                        required: true,
                        default: defaultDeviceId,
                        choices: _(self._devices).map(device => {
                            return { id: device.id, label: device.alias }
                        }).value()
                    }
                ]
            },
            'OFF_ACTION': {
                label: 'Turn a device off',
                options: [
                    {
                        type: 'dropdown',
                        label: 'Device',
                        id: 'deviceId',
                        required: true,
                        default: defaultDeviceId,
                        choices: _(self._devices).map(device => {
                            return { id: device.id, label: device.alias }
                        }).value()
                    }
                ]
            },
        }
        self.setActions(actions)
    }

    action(action) {
        var self = this;

        switch (action.action) {
            case ACTIONS.ON_ACTION:
                self._devices[action.options.deviceId].setPowerState(true)
                self.log('info', `Setting ${self._devices[action.options.deviceId].name} on`)
                break;
            case ACTIONS.OFF_ACTION:
                self._devices[action.options.deviceId].setPowerState(false)
                self.log('info', `Setting ${self._devices[action.options.deviceId].name} off`)
                break;
        }
    }

    destroy() {
        var self = this;

        // self._client.stopDiscovery();

    }

    _discoverDevices() {
        var self = this;

        self._client = new Client();
        self.status(self.STATUS_WARN, "Discovering Devices");
        const discoveryOptions = {
            discoveryTimeout: 3000
        }

        let devices = {};

        return new Promise((resolve, reject) => {

            self._client.startDiscovery(discoveryOptions)
                .on('device-new', (device) => {
                    devices[device.id] = device
                })
                .on('discovery-invalid', (e) => {
                    reject(e)
                })

            setTimeout(() => {
                self.log('info', `Discovered ${_.size(devices)} devices`)
                resolve(devices)
            }, discoveryOptions.discoveryTimeout + 100)
        })


    }

}


exports = module.exports = instance;