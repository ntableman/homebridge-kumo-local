/*
Nathan Tableman w/ code base of 

https://github.com/dlarrick/pykumo and https://github.com/SaMuELToLoKo/homebridge-advanced-thermostat

Thank to the above for their hard work that this is based upon.

that said the advanced thermostat is likely not the right model for this given how it works, this polls the device way too much...
I want to also explore moveing this to a heater/cooler given the options...

Also to do

lots of error checking is missing
type echecking it missing
do we need to support F over C? I dont know...
Auto kind of doesnt work because of the way the unit sets up auto, so need to fix that
ideally, at some point, you pass in your credentials and it goes to Kumo and gets all the units and zones
move this to a platform vs. just having to put in a bunch of acessories
integrate the fan and other things in the same device in HK like the nest ones do
externalize the prototype
hone in on the lifecycle in homebridge
*/



//homebridge stuff
var Service, Characteristic;
// libs needed here
var request = require('request');
//these are for the token
var base64 = require('base-64');
var sjcl = require('sjcl');
var utf8 = require('utf8');


module.exports = function (homebridge) {
	Service = homebridge.hap.Service;
	Characteristic = homebridge.hap.Characteristic;
	homebridge.registerAccessory("homebridge-kumo-local", "Thermostat", Thermostat);
};


function Thermostat(log, config) {

	//basics
	this.log = log;

	//unit info
	this.unitIP = config["unitIP"];
	this.name = config["name"] || "Thermostat";
	this.manufacturer = config["manufacturer"] || "User-Thermostat";
	this.model = config["model"] || "Kumo";
	this.serial_number = config["serial_number"] || "unknown";
	
	//thermostat setup
	this.CurrentHeatingCoolingState = Characteristic.CurrentHeatingCoolingState.OFF;
	this.TargetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.OFF;
	this.CurrentTemperature = 20;
	this.TargetTemperature = 20;
	this.CurrentRelativeHumidity = 20;
	//this.TargetRelativeHumidity = 20;
	this.CoolingThresholdTemperature = 25;
	this.HeatingThresholdTemperature = 20;
	this.maxTemp = config["maxTemp"] || 38;
	this.minTemp = config["minTemp"] || 10;
	//User and login info
	//the below are not used yet
	this.username = config["username"] || "";
	this.password = config["password"] || "";
	//KW comes from the ios app being reversed
	this.KW = config["KW"] || "44c73283b498d432ff25f5c8e06a016aef931e68f0a00ea710e36e6338fb22db";
	//this might not be needed in a crypto format, but leaving it for now
	this.Kcryptopassword = config["Kcryptopassword"] || "";
	this.KCS = config["KCS"] || "";
	//this.log(this.name, this.unitIP, this.KW);
	this.service = new Service.Thermostat(this.name);
}

Thermostat.prototype = {
	identify: function (callback) {
		this.log('Identify requested!');
		return callback(); // success
	},
	getCurrentHeatingCoolingState: function (callback) {
		let url = 'http://' + this.unitIP + '/api?m=' + this.cryptokeyFromAddress('{"c":{"indoorUnit":{"status":{}}}}');
		return request.put({
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json;charset=UTF-8'
			},
			url: url,
			json: {"c":{"indoorUnit":{"status":{}}}}
		}, (function (err, response) {
			var json;
			if (!err && response.statusCode === 200) {
				// need to get some of the real errors here, like api error
				//this.log(response)
				json = response.body;
				this.log("Current State is: %s", json.r.indoorUnit.status.mode);
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
				return callback(null, this.CurrentHeatingCoolingState);

			} else {
				this.log('Error getting Current State: %s', err);
				return callback("Error getting state: " + err);
			}
		}).bind(this));
	},
	//{"r":{"indoorUnit":{"status":{"roomTemp":22,"mode":"heat","spCool":26.500000,"spHeat":21.500000,"vaneDir":"auto","fanSpeed":"auto","tempSource":"unset","activeThermistor":"unset","filterDirty":false,"hotAdjust":false,"defrost":false,"standby":false,"runTest":0}}}}
	//{"_api_error": "device_authentication_error"}
	//Setting Temperature in AC mode:
	//{"c":{"indoorUnit":{"status":{"spCool":23.333333333333332}}}}
	//Setting Temperature in HEAT mode:
	//{"c":{"indoorUnit":{"status":{"spHeat":22.22222222222222}}}}

	getTargetHeatingCoolingState: function (callback) {
		let url = 'http://' + this.unitIP + '/api?m=' + this.cryptokeyFromAddress('{"c":{"indoorUnit":{"status":{}}}}');
		return request.put({
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json;charset=UTF-8'
			},
			url: url,
			json: {"c":{"indoorUnit":{"status":{}}}}
		}, (function (err, response) {
			var json;
			if (!err && response.statusCode === 200) {
				this.log('response success');
				this.log(json);
				json = response.body;
				this.log("Target State is: %s", json.r.indoorUnit.status.mode);
				if (json.r.indoorUnit.status.mode == 'off') {
					this.TargetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.OFF;
				}
				else if (json.r.indoorUnit.status.mode == 'heat') {
					this.TargetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.HEAT;
				}
				else if (json.r.indoorUnit.status.mode == 'cool') {
					this.TargetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.COOL;
				}
				else if (json.r.indoorUnit.status.mode == 'autoHeat') {
					this.TargetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.AUTO;
				}

				return callback(null, this.TargetHeatingCoolingState);

			} else {
				this.log('Error getting Target State: %s', err);
				return callback("Error getting state: " + err);
			}
		}).bind(this));
	},

	setTargetHeatingCoolingState: function (value, callback) {
		var tarState = '';
		this.log('Setting Target State from/to :', this.TargetHeatingCoolingState, value);
		if (value == Characteristic.TargetHeatingCoolingState.OFF) {
			this.TargetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.OFF;
			tarState = JSON.stringify({ "c": { "indoorUnit": { "status": { "mode": "off" } } } });
		}
		else if (value == Characteristic.TargetHeatingCoolingState.HEAT) {
			this.TargetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.HEAT;
			tarState = JSON.stringify({ "c": { "indoorUnit": { "status": { "mode": "heat" } } } });
		}
		else if (value == Characteristic.TargetHeatingCoolingState.COOL) {
			this.TargetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.COOL;
			tarState = JSON.stringify({ "c": { "indoorUnit": { "status": { "mode": "cool" } } } });
		}
		else if (value == Characteristic.TargetHeatingCoolingState.AUTO) {
			this.TargetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.AUTO;
			tarState = JSON.stringify({ "c": { "indoorUnit": { "status": { "mode": "autoHeat" } } } });
		}
		else {
			this.log('Unsupported value', value);
			tarState = 0;
			return callback(value + " state unsupported");
		}
		let url = 'http://' + this.unitIP + '/api?m=' + this.cryptokeyFromAddress(tarState);
		this.log(tarState);
		this.log(url);
		utf8.encode(tarState);

		return request.put({
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json;charset=UTF-8'
			},
			url: url,
			body: tarState
		}, (function (err, response) {
			if (!err && response.statusCode === 200) {
				this.log('response succes setTargetHeatingCoolingState');
				this.log(response.body);
				return callback(null);
			} else {
				this.log('Error setting Target State: %s', err);
				return callback("Error setting mode: " + err);
			}
		}).bind(this));
	},
	getCurrentTemperature: function (callback) {
		let url = 'http://' + this.unitIP + '/api?m=' + this.cryptokeyFromAddress('{"c":{"indoorUnit":{"status":{}}}}');
		return request.put({
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json;charset=UTF-8'
			},
			url: url,
			json: {"c":{"indoorUnit":{"status":{}}}}
		}, (function (err, response) {
			var json;
			if (!err && response.statusCode === 200) {
				this.log('response success getCurrentTemperature');
				json = response.body;
				//json = JSON.parse(response.body);

				this.log('Current Temperature in ℃ is %s', json.r.indoorUnit.status.roomTemp);
				this.CurrentTemperature = parseFloat(json.r.indoorUnit.status.roomTemp);

				return callback(null, this.CurrentTemperature);
			} else {
				this.log('Error getting current temp: %s', err);
				return callback("Error getting current temp: " + err);
			}
		}).bind(this));
	},

	getTargetTemperature: function (callback) {
		let url = 'http://' + this.unitIP + '/api?m=' + this.cryptokeyFromAddress('{"c":{"indoorUnit":{"status":{}}}}');
		return request.put({
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json;charset=UTF-8',
				'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
				'Accept-Language': 'en-us'
			},
			url: url,
			json: {"c":{"indoorUnit":{"status":{}}}}
		}, (function (err, response) {
			var json;
			if (!err && response.statusCode === 200) {
				this.log('response success getTargetTemperature');
				//json = JSON.parse(response.body);
				json = response.body;
				this.log('Current Temperature in ℃ is %s', json.r.indoorUnit.status.roomTemp);
				this.CurrentTemperature = parseFloat(json.r.indoorUnit.status.roomTemp);
				return callback(null, this.TargetTemperature);
			} else {
				this.log('Error getting target temp: %s', err);
				return callback("Error getting target temp: " + err);
			}
		}).bind(this));
	},

	setTargetTemperature: function (value, callback) {
		if (this.CurrentHeatingCoolingState == Characteristic.CurrentHeatingCoolingState.HEAT) {
			command = JSON.stringify({ "c": { "indoorUnit": { "status": { "spHeat": value } } } });
		}
		else if (this.CurrentHeatingCoolingState == Characteristic.CurrentHeatingCoolingState.COOL) {
			command = JSON.stringify({ "c": { "indoorUnit": { "status": { "spCool": value } } } });
		}
		else if (this.CurrentHeatingCoolingState == Characteristic.CurrentHeatingCoolingState.AUTO) {
			command = JSON.stringify({ "c": { "indoorUnit": { "status": { "spHeat": value } } } });
		} 
		else {
			command = JSON.stringify({"c":{"indoorUnit":{"status":{}}}});
		}

		let url = 'http://' + this.unitIP + '/api?m=' + this.cryptokeyFromAddress(command);
		this.log(url);
		this.log(command)
		return request.put({
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json;charset=UTF-8'
			},
			url: url,
			body: command

		}, (function (err, response) {
			if (!err && response.statusCode === 200) {
				this.log('response success setTargetTemperature');
				this.log(response.body);
				return callback(null);
			} else {
				this.log('Error getting state: %s', err);
				return callback("Error setting target temp: " + err);
			}
		}).bind(this));
	},
	//"spCool":26.500000,"spHeat":21.500000
	//Setting Temperature in cool mode:
	//{"c":{"indoorUnit":{"status":{"spCool":23.333333333333332}}}}
	//Setting Temperature in heat mode:
	//{"c":{"indoorUnit":{"status":{"spHeat":22.22222222222222}}}}

	getHeatingThresholdTemperature: function (callback) {
		let url = 'http://' + this.unitIP + '/api?m=' + this.cryptokeyFromAddress('{"c":{"indoorUnit":{"status":{}}}}');
		return request.put({
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json;charset=UTF-8'
			},
			url: url,
			json: {"c":{"indoorUnit":{"status":{}}}}
		}, (function (err, response) {
			var json;
			if (!err && response.statusCode === 200) {
				this.log('response success getHeatingThresholdTemperature');
				json = response.body;
				//json = JSON.parse(body);

				this.log('Target Heat threshoold in ℃ is %s', json.r.indoorUnit.status.spHeat);
				this.HeatingThresholdTemperature = parseFloat(json.r.indoorUnit.status.spHeat);

				return callback(null, this.HeatingThresholdTemperature);
			} else {
				this.log('Error getting target Heat threshold: %s', err);
				return callback("Error getting target heat threshold: " + err);
			}
		}).bind(this));
	},

	setHeatingThresholdTemperature: function (value, callback) {
		if (this.CurrentHeatingCoolingState == Characteristic.CurrentHeatingCoolingState.HEAT) {
			command = JSON.stringify({ "c": { "indoorUnit": { "status": { "spHeat": value } } } })
		}
		else if (this.CurrentHeatingCoolingState == Characteristic.CurrentHeatingCoolingState.COOL) {
			command = JSON.stringify({ "c": { "indoorUnit": { "status": { "spCool": value } } } })
		}

		let url = 'http://' + this.unitIP + '/api?m=' + this.cryptokeyFromAddress(command);
		this.log(command)
		return request.put({
			url: url,
			body: command
		}, (function (err, response) {
			if (!err && response.statusCode === 200) {
				this.log('response success setTargetTemperature');
				this.log(response.body);
				return callback(null);
			} else {
				this.log('Error getting state: %s', err);
				return callback("Error setting target temp: " + err);
			}
		}).bind(this));
	},

	getCoolingThresholdTemperature: function (callback) {
		let url = 'http://' + this.unitIP + '/api?m=' + this.cryptokeyFromAddress('{"c":{"indoorUnit":{"status":{}}}}', this.unitIP);
		return request.put({
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json;charset=UTF-8'
			},
			url: url,
			json: {"c":{"indoorUnit":{"status":{}}}}
		}, (function (err, response) {
			var json;
			if (!err && response.statusCode === 200) {
				this.log('response success getCoolingThresholdTemperature');
				//json = JSON.parse(body);
				json = response.body;

				this.log('Target Cool Threshold in ℃ is %s', json.r.indoorUnit.status.spCool);
				this.CoolingThresholdTemperature = parseFloat(json.r.indoorUnit.status.spCool);

				return callback(null, this.CoolingThresholdTemperature);
			} else {
				this.log('Error getting target Cool threshold: %s', err);
				return callback("Error getting target cool threshold: " + err);
			}
		}).bind(this));
	},

	setCoolingThresholdTemperature: function (value, callback) {
		if (this.CurrentHeatingCoolingState == Characteristic.CurrentHeatingCoolingState.HEAT) {
			command = '{"c":{"indoorUnit":{"status":{"spHeat":' + value + '}}}}'
		}
		else if (this.CurrentHeatingCoolingState == Characteristic.CurrentHeatingCoolingState.COOL) {
			command = '{"c":{"indoorUnit":{"status":{"spCool":' + value + '}}}}'
		}

		let url = 'http://' + this.unitIP + '/api?m=' + this.cryptokeyFromAddress(command);
		this.log(command)
		return request.put({
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json;charset=UTF-8'
			},
			url: url,
			json: command
		}, (function (err, response) {
			if (!err && response.statusCode === 200) {
				this.log('response success setTargetTemperature');
				this.log(response.body);
				return callback(null);
			} else {
				this.log('Error getting state: %s', err);
				return callback("Error setting target temp: " + err);
			}
		}).bind(this));
	},

	getTemperatureDisplayUnits: function (callback) {
		this.TemperatureDisplayUnits = Characteristic.TemperatureDisplayUnits.CELSIUS;
		this.log('Temperature Display Units is ℃');
	},

	setTemperatureDisplayUnits: function (value, callback) {
		this.TemperatureDisplayUnits = Characteristic.TemperatureDisplayUnits.CELSIUS;
		this.log('Temperature Display Units is ℃');
	},

	getCurrentRelativeHumidity: function (callback) {
		var error;
		this.log('Set humidity unsupported');
		error = "Set humidity unsupported";
		return callback(error);
	},

	getTargetRelativeHumidity: function (callback) {
		var error;
		this.log('Get humidity unsupported');
		error = "Get humidity unsupported";
		return callback(error);
	},

	setTargetRelativeHumidity: function (value, callback) {
		var error;
		this.log('Set humidity unsupported');
		error = "Set humidity unsupported";
		return callback(error);
	},

	getName: function (callback) {
		var error;
		this.log('getName :', this.name);
		error = null;
		return callback(error, this.name);
	},

	getServices: function () {

		var informationService = new Service.AccessoryInformation();

		informationService
			.setCharacteristic(Characteristic.Manufacturer, this.manufacturer)
			.setCharacteristic(Characteristic.Model, this.model)
			.setCharacteristic(Characteristic.SerialNumber, this.serial_number);

		this.service
			.getCharacteristic(Characteristic.CurrentHeatingCoolingState)
			.on('get', this.getCurrentHeatingCoolingState.bind(this));

		this.service
			.getCharacteristic(Characteristic.TargetHeatingCoolingState)
			.on('get', this.getTargetHeatingCoolingState.bind(this))
			.on('set', this.setTargetHeatingCoolingState.bind(this));

		this.service
			.getCharacteristic(Characteristic.CurrentTemperature)
			.on('get', this.getCurrentTemperature.bind(this));

		this.service
			.getCharacteristic(Characteristic.TargetTemperature)
			.on('get', this.getTargetTemperature.bind(this))
			.on('set', this.setTargetTemperature.bind(this));

		this.service
			.getCharacteristic(Characteristic.TemperatureDisplayUnits)
			.on('get', this.getTemperatureDisplayUnits.bind(this))
			.on('set', this.setTemperatureDisplayUnits.bind(this));

		this.service
			.getCharacteristic(Characteristic.CurrentRelativeHumidity)
			.on('get', this.getCurrentRelativeHumidity.bind(this));

		/*
		this.service
		.getCharacteristic(Characteristic.TargetRelativeHumidity)
		.on('get', this.getTargetRelativeHumidity.bind(this))
		.on('set', this.setTargetRelativeHumidity.bind(this));
		*/

		this.service
			.getCharacteristic(Characteristic.HeatingThresholdTemperature)
			.on('get', this.getHeatingThresholdTemperature.bind(this))
			.on('set', this.setHeatingThresholdTemperature.bind(this));

		this.service
			.getCharacteristic(Characteristic.CoolingThresholdTemperature)
			.on('get', this.getCoolingThresholdTemperature.bind(this))
			.on('set', this.setCoolingThresholdTemperature.bind(this));

		this.service
			.getCharacteristic(Characteristic.Name)
			.on('get', this.getName.bind(this));

		this.service
			.getCharacteristic(Characteristic.CurrentTemperature)
			.setProps({
				maxValue: 100,
				minValue: 0,
				minStep: 1
			});

		this.service
			.getCharacteristic(Characteristic.TargetTemperature)
			.setProps({
				maxValue: this.maxTemp,
				minValue: this.minTemp,
				minStep: 1
			});

		this.service
			.getCharacteristic(Characteristic.HeatingThresholdTemperature)
			.setProps({
				maxValue: 35,
				minValue: 0,
				minStep: 1
			});

		this.service
			.getCharacteristic(Characteristic.CoolingThresholdTemperature)
			.setProps({
				maxValue: 35,
				minValue: 0,
				minStep: 1
			});

		return [informationService, this.service];

	},

	cryptokeyFromAddress: function (dt) {
		let W = this.h2l(this.KW);
		let p = base64.decode(this.Kcryptopassword);
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
	},

	h2l: function (dt) {
		var r = [];
		for (var i = 0; i < dt.length; i += 2) {
			r.push(parseInt(dt.substr(i, 2), 16));
		}
		return r;
	},

	l2h: function (l) {
		var r = ''
		for (var i = 0; i < l.length; ++i) {
			var c = l[i]
			if (c < 16) r += '0'
			r += Number(c).toString(16);
		}
		return r
	}

};

