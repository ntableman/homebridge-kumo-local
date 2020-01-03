var Service, Characteristic, HomnebridgeAPI;
var request = require('request');
//these are for the token
var base64 = require('base-64');
var sjcl = require('sjcl');
var utf8 = require('utf8');
module.exports = function (homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    HomnebridgeAPI = homebridge;
    homebridge.registerAccessory("homebridge-kumo-local", "kumo-local", Thermostat);
};

function Thermostat(log, config) {
    this.log = log;
    this.name = config.name;
    this.manufacturer = config.manufacturer || "DefaultManufacturer";
    this.model = config.model || "DefaultModel";
    this.unitIP = config.unitIP;
    	//thermostat setup
	this.CurrentHeatingCoolingState = Characteristic.CurrentHeatingCoolingState.OFF;
	this.TargetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.OFF;
	this.CurrentTemperature = 20;
	this.TargetTemperature = 20;
	this.CurrentRelativeHumidity = 20;
	//this.TargetRelativeHumidity = 20;
	this.CoolingThresholdTemperature = 28;
	this.HeatingThresholdTemperature = 22;
    //the below are not used yet
    this.username = config["username"] || "";
    this.password = config["password"] || "";
    //KW comes from the ios app being reversed
    this.KW = config["KW"] || "44c73283b498d432ff25f5c8e06a016aef931e68f0a00ea710e36e6338fb22db";
    //this might not be needed in a crypto format, but leaving it for now
    this.Kcryptopassword = config["Kcryptopassword"]; 
    this.KCS = config["KCS"]; 
    //this.log(this.name, this.unitIP, this.KW);
    this.temperatureDisplayUnits = config.temperatureDisplayUnits || 0;

    this.cacheDir = HomnebridgeAPI.user.persistPath();
    this.storage = require('node-persist');
    this.storage.initSync({ dir: this.cacheDir, forgiveParseErrors: true });

    this.log(this.name);
    this.fanService = new Service.Fan(this.name);
    this.service = new Service.Thermostat(this.name);
}

Thermostat.prototype.getCurrentHeatingCoolingState = function (cb) {
    let url = 'http://' + this.unitIP + '/api?m=' + this.cryptokeyFromAddress('{"c":{"indoorUnit":{"status":{}}}}');
    request.put({
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json;charset=UTF-8'
        },
        url: url,
        json: {"c":{"indoorUnit":{"status":{}}}}
    }, (function (error, response, body) {
        var json;
        if (!error && response.statusCode === 200) {
            //this.log('response success getCurrentHeatingCoolingState');
            json = response.body;
            //json = JSON.parse(response.body);
            this.log('response success getCurrentHeatingCoolingState %s', json.r.indoorUnit.status.mode);
            if (json.r.indoorUnit.status.mode == 'off') {
                this.CurrentHeatingCoolingState = Characteristic.CurrentHeatingCoolingState.OFF;
            }
            else if (json.r.indoorUnit.status.mode == 'heat') {
                this.CurrentHeatingCoolingState = Characteristic.CurrentHeatingCoolingState.HEAT;
            }
            else if (json.r.indoorUnit.status.mode == 'cool') {
                this.CurrentHeatingCoolingState = Characteristic.CurrentHeatingCoolingState.COOL;
            }
            else if (json.r.indoorUnit.status.mode == 'autoHeat') {
                this.CurrentHeatingCoolingState = Characteristic.CurrentHeatingCoolingState.AUTO;
            }
            this.CurrentTemperature = parseFloat(json.r.indoorUnit.status.roomTemp);
            this.storage.setItemSync(this.name + '&' + 'TargetHeatingCoolingState', this.CurrentHeatingCoolingState);
            cb(null, this.currentHeatingCoolingState);
        } else {
            this.log('Error getting current mode: %s', error);
            cb("Error getting current mode: " + error);
        }
    }).bind(this));
};

Thermostat.prototype.getTargetHeatingCoolingState = function (cb) {
    this.targetHeatingCoolingState = this.storage.getItemSync(this.name + '&' + 'TargetHeatingCoolingState');
    this.log(this.targetHeatingCoolingState);
    cb(null, this.targetHeatingCoolingState);
};

Thermostat.prototype.setTargetHeatingCoolingState = function (value, cb) {
    if (value == Characteristic.TargetHeatingCoolingState.OFF) {
        this.TargetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.OFF;
        command = JSON.stringify({ "c": { "indoorUnit": { "status": { "mode": "off" } } } });
    }
    else if (value == Characteristic.TargetHeatingCoolingState.HEAT) {
        this.TargetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.HEAT;
        command = JSON.stringify({ "c": { "indoorUnit": { "status": { "mode": "heat" } } } });
    }
    else if (value == Characteristic.TargetHeatingCoolingState.COOL) {
        this.TargetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.COOL;
        command = JSON.stringify({ "c": { "indoorUnit": { "status": { "mode": "cool" } } } });
    }
    else if (value == Characteristic.TargetHeatingCoolingState.AUTO) {
        this.TargetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.AUTO;
        command = JSON.stringify({ "c": { "indoorUnit": { "status": { "mode": "autoHeat" } } } });
    }
    else {
        this.log('Unsupported value', value);
        command = 0;
        return callback(value + " state unsupported");
    }
    let url = 'http://' + this.unitIP + '/api?m=' + this.cryptokeyFromAddress(command);
    return request.put({
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json;charset=UTF-8'
        },
        url: url,
        body: command
    }, (function (err, response, body) {
        if (!err && response.statusCode === 200) {
            this.log('setTargetHeatingCoolingState %s', response.body);
            this.storage.setItemSync(this.name + '&' + 'TargetHeatingCoolingState', value);
            cb(null);
        } else {
            this.log('Error setting Target State: %s', err);
            cb("Error setting mode: " + err);
        }
    }).bind(this));
};

Thermostat.prototype.getCurrentTemperature = function (cb) {
    let url = 'http://' + this.unitIP + '/api?m=' + this.cryptokeyFromAddress('{"c":{"indoorUnit":{"status":{}}}}');
    request.put({
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json;charset=UTF-8'
        },
        url: url,
        json: {"c":{"indoorUnit":{"status":{}}}}
    }, (function (error, response, body) {
        var json;
        if (!error && response.statusCode === 200) {
            //this.log('response success getCurrentTemperature');
            json = response.body;
            //json = JSON.parse(response.body);
            this.log('Current Temperature in ℃ is %s', json.r.indoorUnit.status.roomTemp);
            this.CurrentTemperature = parseFloat(json.r.indoorUnit.status.roomTemp);
            cb(null, this.CurrentTemperature);
        } else {
            this.log('Error getting current temp: %s', error);
            this.CurrentTemperature = 256;
            cb("Error getting current temp: " + error);
        }
    }).bind(this));
};

Thermostat.prototype.getTargetTemperature = function (cb) {
    this.targetTemperature = this.storage.getItemSync(this.name + '&' + 'TargetTemperature');
    this.log("Target" + this.targetTemperature);
    cb(null, this.targetTemperature);
};

Thermostat.prototype.setTargetTemperature = function (value, cb) {
    this.log(value);
    this.storage.setItemSync(this.name + '&' + 'TargetTemperature', value);
    if (this.CurrentHeatingCoolingState == Characteristic.CurrentHeatingCoolingState.HEAT) {
        command = JSON.stringify({ "c": { "indoorUnit": { "status": { "spHeat": value } } } });
    }
    else if (this.CurrentHeatingCoolingState == Characteristic.CurrentHeatingCoolingState.COOL) {
        command = JSON.stringify({ "c": { "indoorUnit": { "status": { "spCool": value } } } });
    }
    else if (this.CurrentHeatingCoolingState == Characteristic.CurrentHeatingCoolingState.AUTO) {
        command = JSON.stringify({ "c": { "indoorUnit": { "status": { "spHeat": value, "spCool": this.CoolingThresholdTemperature } } } });
    } 
    else {
        command = JSON.stringify({"c":{"indoorUnit":{"status":{}}}});
    }

    let url = 'http://' + this.unitIP + '/api?m=' + this.cryptokeyFromAddress(command);
    this.log("url %s",url);
    this.log("command %s",command)
    return request.put({
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json;charset=UTF-8'
        },
        url: url,
        body: command
    }, (function (err, response, body) {
        if (!err && response.statusCode === 200) {
            this.log("setTargetTemperature %s",response.body);
             cb(null);
        } else {
            this.log('Error getting state: %s', err);
             cb("Error setting target temp: " + err);
        }
    }).bind(this));
};

Thermostat.prototype.getTemperatureDisplayUnits = function (cb) {
    cb(null, this.temperatureDisplayUnits);
};

Thermostat.prototype.setTemperatureDisplayUnits = function (val, cb) {
    this.log(val);
    this.storage.setItemSync(this.name + '&' + 'TemperatureDisplayUnits', val);
    this.temperatureDisplayUnits = val;
    cb();
};

Thermostat.prototype.getName = function (cb) {
    cb(null, this.name);
};

Thermostat.prototype.getHeatingThresholdTemperature = function (cb) {
    cb(null, this.HeatingThresholdTemperature);
};
Thermostat.prototype.setHeatingThresholdTemperature = function (value, cb) {
    this.HeatingThresholdTemperature = value;
    cb(null, this.HeatingThresholdTemperature);
};
Thermostat.prototype.getCoolingThresholdTemperature = function (cb) {
    cb(null, this.CoolingThresholdTemperature);
};
Thermostat.prototype.setCoolingThresholdTemperature = function (value, cb) {
    this.CoolingThresholdTemperature = value;
    cb(null, this.CoolingThresholdTemperature);
};
Thermostat.prototype.getStatusRotationSpeed = function (value, cb) {
    //this.StatusRotationSpeed = value;
    cb(null, this.StatusRotationSpeed);
};
Thermostat.prototype.setStatusRotationSpeed = function (value, cb) {
    this.StatusRotationSpeed = value;
    cb(null, this.StatusRotationSpeed);
};


Thermostat.prototype.getServices = function () {
    this.informationService = new Service.AccessoryInformation();
    this.informationService
        .setCharacteristic(Characteristic.Manufacturer, this.manufacturer)
        .setCharacteristic(Characteristic.Model, this.model);

    this.service
        .getCharacteristic(Characteristic.CurrentHeatingCoolingState)
        .on('get', this.getCurrentHeatingCoolingState.bind(this));

    this.service
        .getCharacteristic(Characteristic.TargetHeatingCoolingState)
        .on('get', this.getTargetHeatingCoolingState.bind(this))
        .on('set', this.setTargetHeatingCoolingState.bind(this));

    this.service
        .getCharacteristic(Characteristic.CurrentTemperature)
        .on('get', this.getCurrentTemperature.bind(this))
        .setProps({
            maxValue: 40,
            minValue: -20,
            minStep: .1
        });

    this.service
        .getCharacteristic(Characteristic.TargetTemperature)
        .on('get', this.getTargetTemperature.bind(this))
        .on('set', this.setTargetTemperature.bind(this))
        .setProps({
            maxValue: 35,
            minValue: 0,
            minStep: .1
        });

    this.service
        .getCharacteristic(Characteristic.HeatingThresholdTemperature)
        .on('get', this.getHeatingThresholdTemperature.bind(this))
        .on('set', this.setHeatingThresholdTemperature.bind(this))
        .setProps({
            maxValue: 30,
            minValue: 15,
            minStep: .1
        });

    this.service
        .getCharacteristic(Characteristic.CoolingThresholdTemperature)
        .on('get', this.getCoolingThresholdTemperature.bind(this))
        .on('set', this.setCoolingThresholdTemperature.bind(this))
        .setProps({
            maxValue: 30,
            minValue: 20,
            minStep: .1
        });

    this.service
        .getCharacteristic(Characteristic.TemperatureDisplayUnits)
        .on('get', this.getTemperatureDisplayUnits.bind(this))
        .on('set', this.setTemperatureDisplayUnits.bind(this));

    //this.service
     //   .getCharacteristic(Characteristic.StatusRotationSpeed)
     //   .on('get', this.getStatusRotationSpeed.bind(this))
     //   .on('set', this.setStatusRotationSpeed.bind(this));

    this.service
        .getCharacteristic(Characteristic.Name)
        .on('get', this.getName.bind(this));

    return [this.informationService, this.service];
};

Thermostat.prototype.cryptokeyFromAddress = function (dt) {
    let W = this.h2l(this.KW);
    let p = base64.decode(this.Kcryptopassword);
    //let p = this.Kcryptopassword;
    let dta = dt;
    let dt1 = sjcl.codec.hex.fromBits(
        sjcl.hash.sha256.hash(
            sjcl.codec.hex.toBits(
                this.l2h(
                    Array.prototype.map.call(p + dta, function (m2) {
                        return m2.charCodeAt(0);
                    })
                )
            )
        )
    );
    let dt1_l = this.h2l(dt1);
    let dt2 = '';
    for (let i = 0; i < 88; i++) {
        dt2 += '00'
    }
    let dt3 = this.h2l(dt2);
    dt3[64] = 8;
    dt3[65] = 64;
    Array.prototype.splice.apply(dt3, [32, 32].concat(dt1_l));
    dt3[66] = 0;
    let cryptoserial = this.h2l(this.KCS);
    dt3[79] = cryptoserial[8];
    dt3[80] = cryptoserial[4];
    dt3[81] = cryptoserial[5];
    dt3[82] = cryptoserial[6];
    dt3[83] = cryptoserial[7];
    dt3[84] = cryptoserial[0];
    dt3[85] = cryptoserial[1];
    dt3[86] = cryptoserial[2];
    dt3[87] = cryptoserial[3];
    Array.prototype.splice.apply(dt3, [0, 32].concat(W));
    let hash = sjcl.codec.hex.fromBits(
        sjcl.hash.sha256.hash(sjcl.codec.hex.toBits(this.l2h(dt3)))
    )
    //this.log('hash: %s', hash);
    //this.log('kumo command: %s', dt);
    return hash;
};
Thermostat.prototype.h2l = function (dt) {
    var r = [];
    for (var i = 0; i < dt.length; i += 2) {
        r.push(parseInt(dt.substr(i, 2), 16));
    }
    return r;
};
Thermostat.prototype.l2h = function (l) {
    var r = ''
    for (var i = 0; i < l.length; ++i) {
        var c = l[i]
        if (c < 16) r += '0'
        r += Number(c).toString(16);
    }
    return r
};
