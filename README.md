# homebridge-kumo-local

A HomeBridge plugin that is a mess and barely works, but it lets you do some basics with a split unit.

# Installation

no idea yet

# Configuration

Configuration sample for homebridge

 ```
    {
        "bridge": {
            ...
        },
        
        "description": "...",

        "accessories": [
            {
                "accessory": "Thermostat",
                "name": "Thermostat name",
                "apiAdress": "http://url",
                "maxTemp": "25",                      // Optional Max Number 100
                "minTemp": "15",                      // Optional Min Numbber 0
                "username": "user",                   // Optional
                "password": "pass"                    // Optional
                "manufacturer": "manufacturer",       // Optional
                "model": "model",                     // Optional
                "serial_number": "serial number",     // Optional
                "units": "dispCelsius"                // Optional (Default dispCelsius = Celsius) dispFahrenheit = Fahrenheit 
                
            }
        ],

        "platforms":[]
    }
```


