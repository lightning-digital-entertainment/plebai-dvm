"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getImageUrl = exports.publishRelay = exports.publishRelays = exports.publishToRelays = exports.readRandomRow = exports.generateRandom9DigitNumber = exports.generateRandom10DigitNumber = exports.requestApiAccess = exports.sendHeaders = exports.relayId = exports.relayIds = void 0;
const fs = __importStar(require("fs"));
const nostr_tools_1 = require("nostr-tools");
const fs_1 = require("fs");
const form_data_1 = __importDefault(require("form-data"));
const axios_1 = __importDefault(require("axios"));
exports.relayIds = [
    'wss://relay.current.fyi',
    'wss://nostr1.current.fyi',
    'wss://nostr-pub.wellorder.net',
    'wss://relay.damus.io',
    'wss://nostr-relay.wlvs.space',
    'wss://nostr.zebedee.cloud',
    'wss://student.chadpolytechnic.com',
    'wss://global.relay.red',
    'wss://nos.lol',
    'wss://relay.primal.net',
    'wss://nostr21.com',
    'wss://offchain.pub',
    'wss://relay.plebstr.com',
    'wss://nostr.mom',
    'wss://relay.nostr.bg',
    'wss://nostr.oxtr.dev',
    'wss://relay.nostr.bg',
    'wss://no.str.cr',
    'wss://nostr-relay.nokotaro.com',
    'wss://relay.nostr.wirednet.jp'
];
exports.relayId = [process.env.RELAY];
function sendHeaders(stream) {
    if (stream) {
        return {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Connection': 'keep-alive',
            'server': 'uvicorn',
            'Cache-Control': 'no-cache',
            'Transfer-Encoding': 'chunked'
        };
    }
    else {
        return {
            'Content-Type': 'application/json',
            'server': 'uvicorn',
        };
    }
}
exports.sendHeaders = sendHeaders;
function requestApiAccess(apiPath) {
    // API key
    // API host
    const host = (process.env.CURRENT_API_HOST || '').trim();
    return {
        headers: {
            'Content-Type': 'application/json',
        },
        url: host + apiPath,
    };
}
exports.requestApiAccess = requestApiAccess;
function generateRandom10DigitNumber() {
    const min = 1000000000; // 10-digit number starting with 1
    const max = 9999999999; // 10-digit number ending with 9
    const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
    return randomNumber;
}
exports.generateRandom10DigitNumber = generateRandom10DigitNumber;
function generateRandom9DigitNumber() {
    const min = 100000000; // 9-digit number starting with 1
    const max = 999999999; // 9-digit number ending with 9
    const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
    return randomNumber;
}
exports.generateRandom9DigitNumber = generateRandom9DigitNumber;
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function readRandomRow(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.trim().split('\n');
        if (lines.length === 0) {
            return null;
        }
        const numberOfLines = content.split('\n');
        const randomIndex = getRandomInt(1, numberOfLines.length);
        return lines[randomIndex];
    }
    catch (err) {
        console.error('Error reading the file:', err);
        return null;
    }
}
exports.readRandomRow = readRandomRow;
function publishToRelays(relays, event) {
    relays.forEach(function (item) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('publishing on', item);
            try {
                yield publishRelay(item, event);
            }
            catch (error) {
                console.log('in catch with error: ', error);
            }
        });
    });
}
exports.publishToRelays = publishToRelays;
function publishRelays(event) {
    exports.relayIds.forEach(function (item) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('publishing on', item);
            try {
                yield publishRelay(item, event);
            }
            catch (error) {
                console.log('in catch with error: ', error);
            }
        });
    });
}
exports.publishRelays = publishRelays;
function publishRelay(relayUrl, event) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const pubrelay = (0, nostr_tools_1.relayInit)(relayUrl);
            yield pubrelay.connect();
            const pub = pubrelay.publish(event);
        }
        catch (e) {
            console.log('in catch with error: ', e);
        }
    });
}
exports.publishRelay = publishRelay;
function getImageUrl(id, outputFormat) {
    return __awaiter(this, void 0, void 0, function* () {
        const form = new form_data_1.default();
        form.append('asset', (0, fs_1.createReadStream)(process.env.UPLOAD_PATH + id + `.` + outputFormat));
        form.append("name", 'current/plebai/genimg/' + id + `.` + outputFormat);
        form.append("type", "image");
        const config = {
            method: 'post',
            url: process.env.UPLOAD_URL,
            headers: Object.assign({ 'Authorization': 'Bearer ' + process.env.UPLOAD_AUTH, 'Content-Type': 'multipart/form-data' }, form.getHeaders()),
            data: form
        };
        const resp = yield axios_1.default.request(config);
        (0, fs_1.unlink)(process.env.UPLOAD_PATH + id + `.` + outputFormat, (err) => {
            if (err) {
                console.log(err);
            }
            console.log('tmp file deleted');
        });
        return resp.data.data;
    });
}
exports.getImageUrl = getImageUrl;
//# sourceMappingURL=helpers.js.map