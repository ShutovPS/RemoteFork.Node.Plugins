"use strict";

const KEY = "/category";

const request = require("request-promise-native");

const express = require("express");
const router = express.Router();

module.exports.KEY = KEY;

module.exports.router = router;

const configs = require("../../../configs");

const SelfReloadJSON = require('self-reload-json');
const pluginSettings = new SelfReloadJSON(__dirname + "/../settings.json");

const getRoot = require("./getroot");
const getFilm = require("./getfilm");

const filmModel = require("../models/film-model");

const DirectoryItem = require("../../../playlist/directory-item");
const PlayList = require("../../../playlist/playlist");

router.get(`/:path/:category/:page`, async function (req, res) {
    await processResponse(res, req.baseUrl, req.params.path, req.params.category, req.params.page);
});

async function processResponse(res, baseUrl, path, category, page) {
    if (baseUrl.endsWith(KEY)) {
        baseUrl = baseUrl.substring(0, baseUrl.lastIndexOf(KEY));
    }

    let url = `${pluginSettings.Links.Api}/${path}.json?category=${category}&page=${page}&api_token=${pluginSettings.Api.Key}`;

    const playList = new PlayList();
    playList.Menu = getRoot.getMenuItems(baseUrl);

    const options = {
        baseUrl: baseUrl, 
        url: url, 
        path: path, 
        category: category, 
        page: page,
        search: false
    }

    await getFilmsItems(playList, options);

    playList.sendResponse(res);
}

async function getFilmsItems(playList, options) {
    try {
        const body = await request.get(options.url);

        getFilmsItemsFromHtml(playList, body, options);
    } catch(error) {
        console.error(KEY, error);
    }
}
module.exports.getFilmsItems = getFilmsItems;

function getFilmsItemsFromHtml(playList, response, options) {
    response = response.match(/\[.*\]/);

    var films = JSON.parse(response);

    var baseItem = new DirectoryItem();
    baseItem.Image = pluginSettings.Icons.IcoFolder;

    if (films !== undefined) {
        for (var i in films) {
            const item = getItem(options.baseUrl, films[i], baseItem);

            var found = playList.Items.find(function(element) {
                return element.Link === item.Link;
            });

            if (!found) {
                playList.Items.push(item);
            }
        }
        
        if (playList.Items.length !== 0) {
            if (!options.search) {
                playList.NextPageUrl = createLink(options.baseUrl, options.path, options.category, parseInt(options.page) + 1);
            }
        }
    }
}

function getItem(baseUrl, film, baseItem) {
    if (film.serial != undefined) {
        film = film.serial;
    }

    var item = new DirectoryItem(baseItem);
    
    item.Title = filmModel.getTitle(film);
    item.Link = getFilm.createLink(baseUrl, null, film.iframe_url);
    item.Description = filmModel.getDescription(film);

    return item;
}

function createLink(baseUrl, path, category, page) {
    let url = `${configs.remoteForkAddress}${baseUrl}${KEY}`;

    url = url + "/" + path;
    
    url = url + "/" + (category || "All");
    
    url = url + "/" + (page || "1");

    return url;
}
module.exports.createLink = createLink;
