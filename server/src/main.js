import os from 'os'
import dotenv from "dotenv";
import express from 'express';
import viewEngine from './configs/viewEngine.js';
import controller from './controls/controller.js';

// VARIABLES
const properties = dotenv.config().parsed;
const application = express();
const ipHost = properties.HOST || 'localhost';
const idHost2 = os.networkInterfaces()['Wi-Fi'];
const port = properties.PORT || 8080;
const path = properties.PATH || '/api';
const [hostDesk, IPv4] = [os.hostname(),
idHost2 ? idHost2[1]?.address : undefined
];

// CONFIGURATION    
viewEngine(application); // configuration
controller(application, path); // controller

// START SERVER
application.listen(port, () => {
    console.log('--++++++++++++++++++++++ LOCAL ++++++++++++++++++++++--');
    for (const host of ['localhost', ipHost])
        if (host) console.log(`- RESTapi on server http://${host}:${port}${path}`);

    console.log('--++++++++++++++++++++ LAN_ACCESS +++++++++++++++++++--');
    for (const host of [hostDesk, IPv4])
        if (host) console.log(`- RESTapi on server http://${host}:${port}${path}`);
});