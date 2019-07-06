"use strict";

const KEY = "/search";

const httpStatus = require("http-status-codes");

const express = require("express");
const router = express.Router();

module.exports.KEY = KEY;

module.exports.router = router;

const configs = require("../../../configs");

const SelfReloadJSON = require('self-reload-json');
const pluginSettings = new SelfReloadJSON(__dirname + "/../settings.json");

const getCategory = require("./getcategory");

const PlayList = require("../../../playlist/playlist");

router.get(`/`, async function (req, res) {
    await processResponse(res, req.baseUrl, req.query.search);
});

async function processResponse(res, baseUrl, search) {
    if (baseUrl.endsWith(KEY)) {
        baseUrl = baseUrl.substring(0, baseUrl.lastIndexOf(KEY));
    }

    search = encodeURIComponent(search);

    let url = `${pluginSettings.Links.Api}/videos.json?title=${search}&api_token=${pluginSettings.Api.Key}`;

    const playList = new PlayList();

    const options = {
        baseUrl: baseUrl, 
        url: url, 
        search: true
    }

    await getCategory.getFilmsItems(playList, options);
    playList.sendResponse(res);
}

function createLink(baseUrl) {
    let url = `${configs.remoteForkAddress}${baseUrl}${KEY}`;

    return url;
}

module.exports.createLink = createLink;
