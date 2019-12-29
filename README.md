# homebridge-kumo-local

A HomeBridge plugin that is a mess and barely works, but it lets you do some basics with a split unit.

# Installation

no idea yet

# Configuration

Configuration sample for homebridge

not done yet, need kumo info

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
                "unitAdress": "http://url",
                "maxTemp": "25",                      
                "minTemp": "15",                      
                "username": "user",                   
                "password": "pass"                    
                "manufacturer": "manufacturer",       
                "model": "model",                     
                "serial_number": "serial number"              
                
            }
        ],

        "platforms":[]
    }
```


