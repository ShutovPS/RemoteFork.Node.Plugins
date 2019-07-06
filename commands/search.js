"use strict";

const KEY = "/search";

const express = require("express");
const router = express.Router();

module.exports.KEY = KEY;

module.exports.router = router;

const configs = require("../../../configs");

const SelfReloadJSON = require('self-reload-json');
const pluginSettings = new SelfReloadJSON(__dirname + "/../settings.json");

const getCategory = require("./getcategory");

const PlayList = require("../../../playlist/playlist");

const searchPage = "videos";

router.get(`/`, async function (req, res) {
    await processResponse(res, req.baseUrl, req.query.search);
});

async function processResponse(res, baseUrl, search) {
    if (baseUrl.endsWith(KEY)) {
        baseUrl = baseUrl.substring(0, baseUrl.lastIndexOf(KEY));
    }

    search = encodeURIComponent(search);

    let url = `${pluginSettings.Links.Api}/${searchPage}.json?title=${search}&api_token=${pluginSettings.Api.Key}`;

    const playList = new PlayList();

    const options = {
        baseUrl: baseUrl, 
        url: url, 
        path: searchPage, 
        page: 1,
        search: search
    }

    await getCategory.getFilmsItems(playList, options);
    playList.sendResponse(res);
}

function createLink(baseUrl) {
    return `${configs.remoteForkAddress}${baseUrl}${KEY}`;
}
module.exports.createLink = createLink;
