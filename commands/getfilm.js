"use strict";

const KEY = "/film";

const request = require("request-promise-native");
const httpStatus = require("http-status-codes");

const express = require("express");
const router = express.Router();

module.exports.KEY = KEY;

module.exports.router = router;

const configs = require("../../../configs");

const SelfReloadJSON = require('self-reload-json');
const programSettings = new SelfReloadJSON("settings.json");
const pluginSettings = new SelfReloadJSON(__dirname + "/../settings.json");

const getRoot = require("./getroot");
const getEpisodes = require("./getepisodes");

const DirectoryItem = require("../../../playlist/directory-item");
const PlayList = require("../../../playlist/playlist");

router.get(`/translations`, async function (req, res) {
    await getSerialTranslations(res, req.baseUrl, req.query.url);
});

router.get(`/seasons`, async function (req, res) {
    await getSerialSeasons(res, req.baseUrl, req.query.url, req.query.referer);
});

router.get(`/series`, async function (req, res) {
    await getSerialSeries(res, req.baseUrl, req.query.url, req.query.referer);
});

async function getSerialTranslations(res, baseUrl, url) {
    if (baseUrl.endsWith(KEY)) {
        baseUrl = baseUrl.substring(0, baseUrl.lastIndexOf(KEY));
    }

    const playList = new PlayList();
    playList.Menu = getRoot.getMenuItems(baseUrl);

    try {
        const options = {
            url: url,
            headers: {
                "Referer": url,
                "User-Agent": programSettings.Environment.UserAgent
            }
        };

        const body = await request.get(options);

        await getSerialTranslationsData(res, baseUrl, playList, url, url, body);
    } catch(error) {
        console.error(KEY, error);
    }

    playList.sendResponse(res);
}

async function getSerialTranslationsData(res, baseUrl, playList, url, referer, moonwalkResponse) {
    var regex = /(translations:\s*)(\[\[.*?\]\])/;

    if (regex.exec(moonwalkResponse)) {
        const translations = regex.exec(moonwalkResponse)[2];

        const baseItem = new DirectoryItem();
        baseItem.Image = pluginSettings.Icons.IcoFolder;

        regex = /(\[)(")(.*?)(")(,")(.*?)("\])/g;
        let match = null;
        
        const countMatches = (regex, str) => {
            return ((str || '').match(regex) || []).length
        }

        if (countMatches(regex, translations) > 1) {
            while ((match = regex.exec(translations)) !== null) {
                const item = new DirectoryItem(baseItem);

                item.Title = match[6];
                item.Link = createLink(baseUrl, "seasons", match[3], referer);

                playList.Items.push(item);
            }
            
            return;
        }
    }

    await getSerialSeasonsData(res, baseUrl, playList, url, referer, moonwalkResponse);
}

async function getSerialSeasons(res, baseUrl, url, referer) {
    if (baseUrl.endsWith(KEY)) {
        baseUrl = baseUrl.substring(0, baseUrl.lastIndexOf(KEY));
    }

    if (!url.includes("://")) {
        url = `${pluginSettings.Links.Site}/serial/${url}/iframe`;
    }

    const playList = new PlayList();
    playList.Menu = getRoot.getMenuItems(baseUrl);
    
    try {
        const options = {
            url: url,
            headers: {
                "Referer": referer,
                "User-Agent": programSettings.Environment.UserAgent
            }
        };

        const body = await request.get(options);

        await getSerialSeasonsData(res, baseUrl, playList, url, url, body);
    } catch(error) {
        console.error(KEY, error);
    }

    playList.sendResponse(res);
}

async function getSerialSeasonsData(res, baseUrl, playList, url, referer, moonwalkResponse) {
    const regex = /(seasons:\s\[)(.*?)(\])/;

    if (regex.exec(moonwalkResponse)) {
        const seasons = regex.exec(moonwalkResponse)[2].split(',');

        const baseItem = new DirectoryItem();
        baseItem.Image = pluginSettings.Icons.IcoFolder;

        if (seasons.length > 0) {
            seasons.forEach(function(season){
                const seasonUrl = `${url}?season=${season}`;

                const item = new DirectoryItem(baseItem);

                item.Title = `Сезон ${season}`;
                item.Link = createLink(baseUrl, "series", seasonUrl, referer);

                playList.Items.push(item);
            });

            return;
        }
    }

    await getSerialSeriesData(res, baseUrl, playList, url, referer, moonwalkResponse);
}

async function getSerialSeries(res, baseUrl, url, referer) {
    if (baseUrl.endsWith(KEY)) {
        baseUrl = baseUrl.substring(0, baseUrl.lastIndexOf(KEY));
    }
    
    const playList = new PlayList();
    playList.Menu = getRoot.getMenuItems(baseUrl);

    try {
        const options = {
            url: url,
            headers: {
                "Referer": referer,
                "User-Agent": programSettings.Environment.UserAgent
            }
        };

        const body = await request.get(options);

        await getSerialSeriesData(res, baseUrl, playList, url, url, body);
    } catch(error) {
        console.error(KEY, error);
    }

    playList.sendResponse(res);
}

async function getSerialSeriesData(res, baseUrl, playList, url, referer, moonwalkResponse) {
    const regex = /(episodes:\s\[)(.*?)(\])/;

    if (regex.exec(moonwalkResponse)) {
        const episodes = regex.exec(moonwalkResponse)[2].split(',');

        const baseItem = new DirectoryItem();
        baseItem.Image = pluginSettings.Icons.IcoFolder;

        if (episodes.length > 0) {
            episodes.forEach(function(episode) {
                const episodeUrl = `${url}${(url.includes("?") ? "&" : "?")}episode=${episode}`;
                const item = new DirectoryItem(baseItem);

                item.Title = `Серия ${episode}`;
                item.Link = getEpisodes.createLink(baseUrl, episodeUrl, referer);

                playList.Items.push(item);
            });

            return;
        }
    }

    await getEpisodes.getEpisodesData(playList, moonwalkResponse);
}

function createLink(baseUrl, type, file, referer) {
    let url = `${configs.remoteForkAddress}${baseUrl}${KEY}`;

    if (!type) {
        type = "translations";
    }

    if (type) {
        url = url + "/" + type;
    }
    
    if (file) {
        url = url + "?url=" + file;

        if (referer) {
            url = url + "&referer=" + referer;
        }
    } else if (referer) {
        url = url + "?referer=" + referer;
    }

    return url;
}

module.exports.createLink = createLink;
