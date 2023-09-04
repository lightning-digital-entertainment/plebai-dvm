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
exports.createGetImage = void 0;
const helpers_1 = require("../helpers");
const stable_diffusion_1 = __importDefault(require("./stable-diffusion"));
const fs_1 = require("fs");
const uuid_1 = require("uuid");
function createGetImage(options) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const client = (0, stable_diffusion_1.default)();
            const id = (0, uuid_1.v4)();
            const { image } = yield client.txt2img({
                prompt: options.prompt ? options.prompt : 'Photo of a classic red mustang car parked in las vegas strip at night',
                negative_prompt: '(NSFW, breasts, Chinese, deformed, distorted, disfigured:1.3), poorly drawn, bad anatomy, wrong anatomy, extra limb, missing limb, floating limbs, (mutated hands and fingers:1.4), disconnected limbs, mutation, mutated, ugly, disgusting, blurry, amputation, (deformed iris, deformed pupils, semi-realistic, cgi, 3d, render, sketch, cartoon, drawing, anime:1.4), text, close up, cropped, out of frame, worst quality, low quality, jpeg artifacts, ugly, duplicate, morbid, mutilated, extra fingers, mutated hands, poorly drawn hands, poorly drawn face, mutation, deformed, blurry, dehydrated, bad anatomy, bad proportions, extra limbs, cloned face, disfigured, gross proportions, malformed limbs, missing arms, missing legs, extra arms, extra legs, fused fingers, too many fingers, long neck ',
                width: options.width ? options.width : 512,
                height: options.height ? options.height : 768,
                steps: 20,
                guidance: 10,
                seed: 42,
                model: options.model ? options.model : "realistic-vision-v3",
                scheduler: "euler_a",
                output_format: "jpeg"
            });
            (0, fs_1.writeFileSync)(process.env.UPLOAD_PATH + id + `.jpeg`, image, 'base64');
            if (image)
                return yield (0, helpers_1.getImageUrl)('data:image/png;base64,' + image, id, 'jpeg');
        }
        catch (error) {
            console.log(error);
            return null;
        }
        return null;
    });
}
exports.createGetImage = createGetImage;
//# sourceMappingURL=createText2Image.js.map