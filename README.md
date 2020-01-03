# homebridge-kumo-local

A HomeBridge plugin that is a mess and barely works, but it lets you do some basics with a split unit.

# Installation

So you have to get 2 pieces of info from your Kumo account, they best way to do this is sniff the HTTP traffic. I did it using charles on my phone, but you can do it with curl - I just havnt been able to get that done yet to make it easy.

* your password encrypted (this might noy be needed in the future)
* the crypto serial

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


