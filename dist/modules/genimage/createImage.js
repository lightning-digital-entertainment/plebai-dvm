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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createImage = void 0;
const uuid_1 = require("uuid");
const fs_1 = require("fs");
const sdwebui_1 = __importDefault(require("./sdwebui"));
const types_1 = require("./types");
const helpers_1 = require("../helpers");
function createImage(prompt, width, height, hiresImage) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const client = (0, sdwebui_1.default)();
            const id = (0, uuid_1.v4)();
            let hires = null;
            if (hiresImage) {
                hires = { steps: 20,
                    denoisingStrength: 0.7,
                    upscaler: '4x-UltraSharp',
                    upscaleBy: 2,
                    resizeWidthTo: 1024,
                    resizeHeigthTo: 1536 };
            }
            const { images } = yield client.txt2img({
                prompt: prompt ? prompt : 'Photo of a classic red mustang car parked in las vegas strip at night',
                negativePrompt: '(NSFW, Chinese, deformed, distorted, disfigured:1.3), poorly drawn, bad anatomy, wrong anatomy, extra limb, missing limb, floating limbs, (mutated hands and fingers:1.4), disconnected limbs, mutation, mutated, ugly, disgusting, blurry, amputation, CyberRealistic_Negative-neg, (Chinese, deformed, distorted, disfigured:1.3), poorly drawn, bad anatomy, wrong anatomy, extra limb, missing limb, floating limbs, (mutated hands and fingers:1.4), disconnected limbs, mutation, mutated, ugly, disgusting, blurry, amputation, CyberRealistic_Negative-neg, ',
                samplingMethod: types_1.SamplingMethod.DPMPlusPlus_2M_Karras,
                width: width ? width : 512,
                height: height ? height : 768,
                steps: 20,
                batchSize: 1,
                seed: (0, helpers_1.generateRandom10DigitNumber)(),
                restoreFaces: true,
                hires,
            });
            images.forEach((image, i) => (0, fs_1.writeFileSync)(process.env.UPLOAD_PATH + id + `.png`, images[i], 'base64'));
            return yield (0, helpers_1.getImageUrl)(id, 'png');
        }
        catch (err) {
            console.error(err);
            return null;
        }
    });
}
exports.createImage = createImage;
//# sourceMappingURL=createImage.js.map