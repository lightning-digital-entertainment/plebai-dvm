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
Object.defineProperty(exports, "__esModule", { value: true });
const nostr_tools_1 = require("nostr-tools");
require("websocket-polyfill");
const dotenv = __importStar(require("dotenv"));
const text2image_1 = require("./GenerateTasks/text2image");
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        dotenv.config();
        console.log('Starting to subscribe with', process.env.RELAY);
        const relays = [process.env.RELAY,];
        const pool = new nostr_tools_1.SimplePool();
        const sub = pool.sub(relays, [
            {
                limit: 0,
                kinds: [65005],
            }
        ]);
        sub.off('event', (event) => __awaiter(this, void 0, void 0, function* () { return; }));
        sub.on('event', (event) => __awaiter(this, void 0, void 0, function* () {
            console.log(event);
            if (yield (0, text2image_1.genImageFromText)(event)) {
                console.log('Image generation success for event ID: ', event.id);
            }
            else {
                console.log('Image generation failed for event ID: ', event.id);
            }
        }));
    });
}
run().catch(console.log);
//# sourceMappingURL=index.js.map