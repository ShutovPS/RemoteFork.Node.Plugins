"use strict";

const SelfReloadJSON = require("self-reload-json");
const packageInfo = new SelfReloadJSON(__dirname + "/package.json");

module.exports.Package = packageInfo;

const fs = require("fs");
const path = require("path");

const express = require("express");
const router = express.Router();

module.exports.router = router;

const commandPath = "./commands/"

const registerRequest = (path) => {
    const module = require(path);

    if (module.KEY) {
        router.use(module.KEY, module.router);
    }
}

const registerRequests = (directory) => {
    const dirCont = fs.readdirSync( directory );
    const files = dirCont.filter( function( elm ) {
        return elm.endsWith(".js");
    });

    files.forEach(file => {
        try {
            registerRequest(path.join(directory, file));
        } catch(error) {
            console.error(error);
        }
    });
}

const directoryPath = path.join(__dirname, commandPath);

registerRequests(directoryPath);
