# homebridge-kumo-local

A HomeBridge plugin that is a mess and barely works, but it lets you do some basics with a split unit.

# Installation

no idea yet

read the code to see the install sig, as this is a major WIP...it only kinda of works.

it needs a lot of help...

# Configuration

Configuration sample for homebridge - use the config-x config panel to make it easy

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
                "unitIP": "ip of unit",
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


