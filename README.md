# homebridge-kumo-local

A HomeBridge plugin that is a mess and barely works, but it lets you do some basics with a split unit.

DONT USE THIS, GO HERE: https://github.com/fjs21/homebridge-kumo#readme his work works :)

# Installation

So you have to get 2 pieces of info from your Kumo account:

run this

curl -d '{"username": "KUMO-USERNAME","password": "KUMO-PASSWORD"}' -H "Content-Type: application/json" -X POST https://geo-c.kumocloud.com/login

* password
* cryptoSerial

read the code to see the install sig, as this is a major WIP...it only kinda of works and I setup the config-x thing to ask you for these.

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
            ,
        {
            "name": "Bedroom Thermostat",
            "unitIP": "192.168.X.X",
            "Kcryptopassword": "**from Kumo**",
            "KCS": "**from kumo**",
            "manufacturer": "whatever",
            "accessory": "kumo-local"
        }
        ],

        "platforms":[]
    }
```

# To Do!
* fan control
* better logging.debug
* fewer calls
* self config
* platform for self config
