"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.genImageFromText = void 0;
const nostr_tools_1 = require("nostr-tools");
require("websocket-polyfill");
const helpers_1 = require("../modules/helpers");
const createText2Image_1 = require("../modules/getimage/createText2Image");
function genImageFromText(event65005) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let prompt = '';
            let sizes = [];
            let output = '';
            let relays = [];
            event65005.tags.forEach(function (tag) {
                if (tag[0] === 'i' && tag[2] === 'text')
                    prompt = (tag[1]);
                if (tag[0] === 'param' && tag[1] === 'size')
                    sizes = tag[2].split('x');
                if (tag[0] === 'output')
                    output = tag[1];
                if (tag[0] === 'relays')
                    relays = tag[1].split(',');
            });
            if (prompt === '')
                return false;
            const model = 'icbinp-final';
            const options = {
                prompt,
                model,
                'width': (sizes[0] && parseInt(sizes[0], 10) < 1024) ? parseInt(sizes[0], 10) : 512,
                'height': (sizes[1] && parseInt(sizes[1], 10) < 1024) ? parseInt(sizes[1], 10) : 512
            };
            const content = yield (0, createText2Image_1.createGetImage)(options);
            // const content = await createImage(prompt, (sizes[0] && parseInt(sizes[0], 10) < 1024)?parseInt(sizes[0], 10):512, (sizes[1] && parseInt(sizes[1], 10) < 1024)?parseInt(sizes[1], 10):768, true);
            if (content === null)
                return false;
            const tags = [];
            tags.push(['e', event65005.id]);
            tags.push(['p', event65005.pubkey]);
            tags.push(["status", "success"]);
            tags.push(["request", JSON.stringify(event65005)]);
            const event65001 = {
                kind: 65001,
                pubkey: (0, nostr_tools_1.getPublicKey)(process.env.SK1),
                created_at: Math.floor(Date.now() / 1000),
                tags,
                content
            };
            event65001.id = (0, nostr_tools_1.getEventHash)(event65001);
            event65001.sig = (0, nostr_tools_1.getSignature)(event65001, process.env.SK1);
            console.log('65001 Event: ', event65001);
            if (relays.length > 0)
                (0, helpers_1.publishToRelays)(relays, event65001);
            return true;
        }
        catch (error) {
            console.log('In catch with error: ', error);
            return false;
        }
    });
}
exports.genImageFromText = genImageFromText;
//# sourceMappingURL=text2image.js.map