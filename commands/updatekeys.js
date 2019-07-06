"use strict";

const KEY = "/updatekeys";

const request = require("request-promise-native");
const httpStatus = require("http-status-codes");

const express = require("express");
const router = express.Router();

module.exports.KEY = KEY;

module.exports.router = router;

const configs = require("../../../configs");

const SelfReloadJSON = require('self-reload-json');
const pluginSettings = new SelfReloadJSON(__dirname + "/../settings.json");

const PlayList = require("../../../playlist/playlist");

router.get(`/`, async function (req, res) {
    await updateMoonwalkKeys();

    const playList = new PlayList();

    playList.Info = "Ключи шифрования обновлены";

    playList.sendResponse(res);
});

async function updateApi(callback) {
    try {
        const body = await request.get(pluginSettings.Api.DataUrl);

        var data = JSON.parse(body);
        pluginSettings.Api.DomainId = data.domain;
        pluginSettings.Api.Key = data.key;
    } catch(error) {
        console.error(KEY, error);
    }
}

async function updateKeys() {

    try {
        const body = await request.get(pluginSettings.Encryption.Url);

        try {
            const regex = /(iv\s*\=\s*")([\d\w]+)(")/;
            const match = regex.exec(body);
            if (match) {
                const iv = match[2];
        
                if (iv && iv.trim()) {
                    pluginSettings.Encryption.IV = iv;
                }
            }
        } catch (error) {
            console.error(KEY, error);
        }
    
        try {
            const regex = /(key\s*\=\s*")([\d\w]+)(")/;
            const match = regex.exec(body);
            if (match) {
                const key = match[2];

                if (key && key.trim()) {
                    pluginSettings.Encryption.Key = key;
                }
            }
        } catch (error) {
            console.error(KEY, error);
        }
    } catch(error) {
        console.error(KEY, error);
    }
}

async function updateMoonwalkKeys() {
    await updateApi();
    await updateKeys();

    pluginSettings.save({space: "\t"});
}
module.exports.updateMoonwalkKeys = updateMoonwalkKeys;

function createLink(baseUrl) {
    let url = `${configs.remoteForkAddress}${baseUrl}${KEY}`;

    return url;
}

module.exports.createLink = createLink;
