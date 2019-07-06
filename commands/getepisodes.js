"use strict";

const KEY = "/episode";

const request = require("request-promise-native");
const httpStatus = require("http-status-codes");

const crypto = require('crypto');
const algorithm = 'aes-256-cbc';

const express = require("express");
const router = express.Router();

module.exports.KEY = KEY;

module.exports.router = router;

const configs = require("../../../configs");

const SelfReloadJSON = require("self-reload-json");
const programSettings = new SelfReloadJSON("settings.json");
const pluginSettings = new SelfReloadJSON(__dirname + "/../settings.json");

const getRoot = require("./getroot");
const updateKeys = require("./updatekeys");

const FileItem  = require("../../../playlist/file-item");
const PlayList = require("../../../playlist/playlist");

router.get(`/`, async function (req, res) {
    await getEpisodes(res, req.baseUrl, req.query.url, req.query.referer);
});

async function getEpisodes(res, baseUrl, url, referer) {
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
        await getEpisodesData(playList, body);
    } catch (error) {
        console.error(KEY, error);
    }
    
    playList.sendResponse(res);
}

async function getEpisodesData(playList, body) {
    var regex = /(<script src=")(.*?)(">)/;

    if (regex.exec(body)) {
        regex = /(host:\s?')(.*?)(')/;
        const scriptHost = regex.exec(body)[2];

        regex = /(proto:\s?')(.*?)(')/;
        const scriptProto = regex.exec(body)[2];

        let moonwalkUrl = pluginSettings.Links.Site;

        if (scriptHost && scriptHost.trim() && scriptProto && scriptProto.trim()) {
            moonwalkUrl = scriptProto + scriptHost;
        }

        regex = /(video_token:\s*')(.*?)(')/;
        const videoToken = regex.exec(body)[2];

        regex = /(partner_id:\s*)(\d+)/;
        const partnerId = regex.exec(body)[2];

        regex = /(domain_id:\s*)(\d+)/;
        const domainId = regex.exec(body)[2];

        // regex = /(window\['[\d\w]+'\]\s?=\s?')(.*?)(')/;
        // const windowId = regex.exec(body)[2];

        regex = /(ref:\s*\')(.*?)(\')/;
        const scriptRef = regex.exec(body)[2];

        const o = {
            a: parseInt(partnerId),
            b: parseInt(domainId),
            c: false,
            // d: windowId,
            e: videoToken,
            f: programSettings.Environment.UserAgent
        };

        await parseEpisodesData(playList, moonwalkUrl, scriptRef, o, true);

        if (playList.Items.length === 0 && o.b != pluginSettings.Api.DomainId) {
            o.b = parseInt(pluginSettings.Api.DomainId);
            await parseEpisodesData(playList, moonwalkUrl, scriptRef, o, false);
        }
    }
}
module.exports.getEpisodesData = getEpisodesData;

async function parseEpisodesData(playList, moonwalkUrl, scriptRef, o, doubleCheck) {
    let q = JSON.stringify(o);

    try {
        q = await encryptQ(q);
    } catch(error) {
        console.error(KEY, error);
    }

    q = encodeURIComponent(q);

    const options = {
        url: moonwalkUrl + "/vs",
        form: `q=${q}&ref=${scriptRef}`,
        headers:{ "User-Agent": programSettings.Environment.UserAgent}
    };

    const sendPost = async () => {
        try {
            const body = await request.post(options);
            await parseResponseData(playList, body);
        } catch(error) {
            console.error(KEY, error);
        }
    };

    await sendPost();

    if (playList.Items.length === 0 && doubleCheck) {
        await updateKeys.updateMoonwalkKeys();

        await sendPost();
    }
}

async function parseResponseData(playList, response) {
    if (response) {
        let url = parseEpisodesLink(response, pluginSettings.UseMp4);

        if (url) {
            await parseLinksData(playList, url, pluginSettings.UseMp4);
        } else {
            url = parseEpisodesLink(response, !pluginSettings.UseMp4);

            if (url) {
                await parseLinksData(playList, url, !pluginSettings.UseMp4);
            }
        }
    }
}

function parseEpisodesLink(response, useMp4) {
    if (response) {
        const regex = useMp4
            ? /("mp4":\s*")(.*?)(")/
            : /("m3u8":\s*")(.*?)(")/;

        if (regex.exec(response)) {
            return regex.exec(response)[2];
        }
    }

    return "";
}

async function parseLinksData(playList, url, useMp4) {
    if (url) {
        function replaceUnicodeSymbols(text) {
            const regex = /\\u([\dA-Fa-f]{4})/g;
            let match = null;
        
            while ((match = regex.exec(text)) !== null) {
                text = text.replace(match[0], String.fromCharCode(parseInt(match[1], 16)));
            }
        
            return text;
        }
        
        url = replaceUnicodeSymbols(url);
        console.log(KEY, url);

        try {
            const body = await request.get(url);

            const regex = useMp4
                ? /(")(\d+)(".*?")(https?.*?)(")/g
                : /(#EXT-X.*?=)(\d+x\d+)([\s\S]*?)(https?:.*)/g;

            const baseItem = new FileItem();
            baseItem.Image = pluginSettings.Icons.IcoVideo;

            let match = null;

            while ((match = regex.exec(body)) !== null) {
                const item = new FileItem(baseItem);

                item.Title = match[2];
                item.Link = match[4];

                playList.Items.push(item);
            }
        } catch(error) {
            console.error(EKY, error);
        }   
    }
}

async function encryptQ(text) {
    const key = Buffer.from(pluginSettings.Encryption.Key, 'hex');
    const iv = Buffer.from(pluginSettings.Encryption.IV, 'hex');

    let cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return encrypted.toString('base64');
}

function createLink(baseUrl, file, referer) {
    let url = `${configs.remoteForkAddress}${baseUrl}${KEY}`;
    
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
