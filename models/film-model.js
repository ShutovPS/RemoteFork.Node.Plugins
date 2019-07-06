"use strict";

const StringBuilder = require("string-builder");

function getTitle(item) {
    let title = "";

    if (item.title_ru) {
        title = item.title_ru;
    }
    if (item.title_en) {
        if (!title) {
            title = item.title_en;
        } else {
            title = `${title} / ${item.title_en}`;
        }
    }

    if (item.year != 0) {
        title = `${title} (${item.year})`;
    }

    return title;
}

module.exports.getTitle = getTitle;

function getDescription(item) {
    const sb = new StringBuilder();

    if (item.material_data) {
        if (item.material_data.poster && item.material_data.poster.trim()) {
            sb.appendFormat("<div id=\"poster\" style=\"float: left; padding: 4px; background-color: #eeeeee; margin: 0px 13px 1px 0px;\"><img style=\"width: 180px; float: left;\" src=\"{0}\" /></div>", 
                item.material_data.poster);
        }

        sb.appendFormat("<span style=\"color: #3366ff;\"><strong>{0}</strong></span><br />", 
            getTitle(item));

        if (item.material_data.tagline && item.material_data.tagline.trim()) {
            sb.appendFormat("<span style=\"color: #999999;\">{0}</span><br />", 
                item.material_data.tagline);
        }

        if (item.season_episodes_count != undefined) {
            sb.appendFormat("<strong><span style=\"color: #ff9900;\">Сезоны:</span></strong> {0}<br />", 
                item.season_episodes_count);
        }

        if (item.source_type && item.source_type.length > 3) {
            sb.appendFormat("<strong><span style=\"color: #ff9900;\">Качество:</span></strong> {0}<br />", 
                item.source_type);
        }

        if (item.material_data.countries != undefined && item.material_data.countries.length != 0) {
            sb.appendFormat("<span style=\"color: #339966;\"><strong>Страны:</strong></span> {0}<br />", 
                item.material_data.countries.slice(0,3).join(", "));
        }

        if (item.material_data.genres != undefined && item.material_data.genres.length != 0) {
            sb.appendFormat("<span style=\"color: #339966;\"><strong>Жанры:</strong></span> {0}<br />", 
                item.material_data.genres.slice(0,3).join(", "));
        }

        if (item.material_data.actors != undefined && item.material_data.actors.length != 0) {
            sb.appendFormat("<span style=\"color: #339966;\"><strong>Актеры:</strong></span> {0}<br />", 
                item.material_data.actors.slice(0,3).join(", "));
        }

        if (item.material_data.directors != undefined && item.material_data.directors.length != 0) {
            sb.appendFormat("<span style=\"color: #339966;\"><strong>Режисеры:</strong></span> {0}<br />", 
                item.material_data.directors.slice(0,3).join(", "));
        }

        if (item.kinopoisk_id && item.kinopoisk_id !== 0) {
            sb.appendFormat("<img style=\"padding: 5px;\" src=\"https://rating.kinopoisk.ru/{0}.gif\" align=\"absmiddle\" />", 
                item.kinopoisk_id);
        }

        if (item.material_data.description && item.material_data.description.trim()) {
            sb.appendFormat("<p>{0}</p>", 
                item.material_data.description);
        }
    } else {
        return getMiniDescription(item);
    }

    return sb.toString();
}

module.exports.getDescription = getDescription;

function getMiniDescription(item) {
    const sb = new StringBuilder();

    sb.appendFormat("<span style=\"color: #3366ff;\"><strong>{0}</strong></span><br />", 
        getTitle(item));

    if (item.season_episodes_count != undefined) {
        sb.appendFormat("<strong><span style=\"color: #ff9900;\">Сезоны:</span></strong> {0}<br />", 
            item.season_episodes_count);
    }

    if (item.source_type && item.source_type.length > 3) {
        sb.appendFormat("<strong><span style=\"color: #ff9900;\">Качество:</span></strong> {0}<br />", 
            item.source_type);
    }

    if (item.kinopoisk_id && item.kinopoisk_id !== 0) {
        sb.appendFormat("<img style=\"padding: 5px;\" src=\"https://rating.kinopoisk.ru/{0}.gif\" align=\"absmiddle\" />", 
            item.kinopoisk_id);
    }

    return sb.toString();
}

module.exports.getMiniDescription = getMiniDescription;
