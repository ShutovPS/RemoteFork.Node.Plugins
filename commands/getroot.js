"use strict";

const KEY = "/";

const express = require("express");
const router = express.Router();

module.exports.KEY = KEY;

module.exports.router = router;

const SelfReloadJSON = require('self-reload-json');
const pluginSettings = new SelfReloadJSON(__dirname + "/../settings.json");

const getCategory = require("./getcategory");
const search = require("./search");
const updateKeys = require("./updatekeys");

const DirectoryItem = require("../../../playlist/directory-item");
const SearchItem = require("../../../playlist/search-item");
const PlayList = require("../../../playlist/playlist");
const SubmenuItem = require("../../../playlist/submenu-item");

const categoryDictionary = {
    "Зарубежные фильмы": baseUrl => {return getCategory.createLink(baseUrl, "movies_updates")},
    "Русские фильмы": baseUrl => {return getCategory.createLink(baseUrl, "movies_updates", "Russian")},
    "Зарубежные сериалы": baseUrl => {return getCategory.createLink(baseUrl, "serials_updates")},
    "Русские сериалы": baseUrl => {return getCategory.createLink(baseUrl, "serials_updates", "Russian")},
    "Аниме фильмы": baseUrl => {return getCategory.createLink(baseUrl, "movies_updates", "Anime")},
    "Аниме сериалы": baseUrl => {return getCategory.createLink(baseUrl, "serials_updates", "Anime")}
}

router.get("/", function (req, res) {
    const playList = new PlayList();

    playList.Items = getRootItems(req.baseUrl);

    playList.sendResponse(res);
});

function getSearch(baseUrl) {
    const searchItem = new SearchItem();
    
    searchItem.Title = "Поиск",
    searchItem.Link = search.createLink(baseUrl),
    searchItem.Image = pluginSettings.Icons.IcoSearch

    return searchItem;
}
module.exports.getRootItems = getRootItems;

function getCategories(baseUrl) {
    const resultItems = [];

    var baseItem = new DirectoryItem();
    baseItem.Image = pluginSettings.Icons.IcoFolder;

    for (var key in categoryDictionary) {
        const item = new DirectoryItem(baseItem);

        item.Title = key;
        item.Link = categoryDictionary[key](baseUrl);

        resultItems.push(item);
    }

    return resultItems;
}
module.exports.getCategories = getCategories;

function getUpdate(baseUrl) {
    const updateItem = new DirectoryItem();

    updateItem.Title = "Обновить ключи";
    updateItem.Link = updateKeys.createLink(baseUrl);
    updateItem.Image = pluginSettings.Icons.IcoUpdate;

    return updateItem;
}
module.exports.getRootItems = getRootItems;

function getRootItems(baseUrl) {
    const resultItems = [];

    const searchItem = getSearch(baseUrl);
    resultItems.push(searchItem);

    const categories = getCategories(baseUrl);
    categories.forEach(function(category) {
        resultItems.push(category);
    });

    const updateItem = getUpdate(baseUrl);
    resultItems.push(updateItem);

    return resultItems;
}

function getMenuItems(baseUrl) {
    const resultItems = [];

    const searchItem = getSearch(baseUrl);
    resultItems.push(searchItem);

    const submenu = new SubmenuItem();
    submenu.Items = getCategories(baseUrl);
    submenu.Title = "Категории";
    resultItems.push(submenu);

    const updateItem = getUpdate(baseUrl);
    resultItems.push(updateItem);

    return resultItems;
}
module.exports.getMenuItems = getMenuItems;
