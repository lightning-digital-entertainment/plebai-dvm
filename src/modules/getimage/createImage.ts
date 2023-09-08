import { generateRandom9DigitNumber, getImageUrl, getResults } from "../helpers";
import sdxlText2Image from "./sdxlText2Image";
import sdxlImage2Image from "./sdxlImage2Image";
import { writeFileSync} from 'fs'
import { v4 as uuidv4 } from 'uuid';
import { TextToImageRequest } from "./text-to-image";
import { StructuredOutputParser } from "langchain/output_parsers";
import { OpenAI} from 'langchain/llms/openai';
import { PromptTemplate } from 'langchain/prompts'
import { ModelIds, closestMultipleOf256, findBestMatch } from '../helpers';
import { ImageToImageRequest } from "./image-to-image";
import axios from 'axios';
import { ZepClient } from "@getzep/zep-js";
import { loadQAStuffChain } from "langchain/chains";
import { Document } from "langchain/document";
import sharp from "sharp";

const parser = StructuredOutputParser.fromNamesAndDescriptions({
    prompt: "output prompt enhanced for image generation",
    model: "model name from the list of model name give as input prompt",
    width: "width of the image",
    height: "height of the image",
});


export async function createGetImageWithPrompt(prompt:string, imageUrl:string): Promise<string> {

    const response = await createPromptUsingChatGPT(prompt);

    const imageString = await getBase64ImageFromURL(imageUrl);

    if (imageString !== null) {

        try {
            console.log('inside image url', imageUrl)
            const options:Partial<ImageToImageRequest>  = await parser.parse(response);
            if (options && options.model) options.model = findBestMatch(options.model, ModelIds);
            if (options && options.height) options.height = closestMultipleOf256(options.height);
            if (options && options.width) options.width= closestMultipleOf256(options.width);
            options.image = imageString;
            options.prompt = prompt;
            if (prompt.includes( 'portrait')) {
                options.height=1024
                options.width=768

              }
              if (prompt.includes('landscape')) {
                options.height=768
                options.width=1024

              }
            console.log('Final Input: ', options);
            const content = await createGetImage2Image(options);
            console.log(content);

            return content;


        } catch (error) {
            console.log(error)

        }




    } else {

        try {

            const options:Partial<TextToImageRequest>  = await parser.parse(response);
            if (options && options.model) options.model = findBestMatch(options.model, ModelIds);
            if (options && options.height) options.height = closestMultipleOf256(options.height);
            if (options && options.width) options.width= closestMultipleOf256(options.width);
            console.log(options);
            if (prompt.includes( 'portrait')) {
                options.height=1024
                options.width=768

              }
              if (prompt.includes('landscape')) {
                options.height=768
                options.width=1024

              }
            const content = await createGetImage(options);
            console.log(content);

            return content;


          } catch (error) {

            console.log(error)
            return null;

          }


    }







}




export async function createGetImage (options: Partial<TextToImageRequest>): Promise<string> {

    try {

        const client = sdxlText2Image();
        const id = uuidv4()
        const outputFormat = options.output_format?options.output_format:"jpeg";

        const { image } = await client.txt2img({
            prompt: options.prompt ? options.prompt : 'Photo of a classic red mustang car parked in las vegas strip at night',
            negative_prompt: options.negative_prompt?options.negative_prompt:'(NSFW, breasts, Chinese, deformed, distorted, disfigured:1.3), poorly drawn, bad anatomy, wrong anatomy, extra limb, missing limb, floating limbs, (mutated hands and fingers:1.4), disconnected limbs, mutation, mutated, ugly, disgusting, blurry, amputation, (deformed iris, deformed pupils, semi-realistic, cgi, 3d, render, sketch, cartoon, drawing, anime:1.4), text, close up, cropped, out of frame, worst quality, low quality, jpeg artifacts, ugly, duplicate, morbid, mutilated, extra fingers, mutated hands, poorly drawn hands, poorly drawn face, mutation, deformed, blurry, dehydrated, bad anatomy, bad proportions, extra limbs, cloned face, disfigured, gross proportions, malformed limbs, missing arms, missing legs, extra arms, extra legs, fused fingers, too many fingers, long neck ',
            width: options.width ? options.width : 512,
            height: options.height ? options.height : 768,
            steps: options.steps?options.steps:20,
            guidance: options.guidance?options.guidance:10,
            seed: options.seed?options.seed:generateRandom9DigitNumber(),
            model: options.model?options.model: "realistic-vision-v3",
            scheduler: options.scheduler?options.scheduler:"dpmsolver++",
            output_format: options.output_format?options.output_format:"jpeg"
        })


        if (image) {
            writeFileSync( process.env.UPLOAD_PATH + id + `.` + outputFormat, image, 'base64')
            return await getImageUrl( id, outputFormat)
        } else {

            return null;
        }




    } catch (error) {

        console.log(error);
        return null;

    }


}

export async function createGetImage2Image (options: Partial<ImageToImageRequest>): Promise<string> {

  try {

      const client = sdxlImage2Image();
      const id = uuidv4()
      const outputFormat = options.output_format?options.output_format:"jpeg";

      const { image } = await client.img2img({
          prompt: options.prompt ? options.prompt : 'Photo of a classic red mustang car parked in las vegas strip at night',
          image: options.image?options.image:'',
          negative_prompt: options.negative_prompt?options.negative_prompt:'(NSFW, breasts, Chinese, deformed, distorted, disfigured:1.3), poorly drawn, bad anatomy, wrong anatomy, extra limb, missing limb, floating limbs, (mutated hands and fingers:1.4), disconnected limbs, mutation, mutated, ugly, disgusting, blurry, amputation, (deformed iris, deformed pupils, semi-realistic, cgi, 3d, render, sketch, cartoon, drawing, anime:1.4), text, close up, cropped, out of frame, worst quality, low quality, jpeg artifacts, ugly, duplicate, morbid, mutilated, extra fingers, mutated hands, poorly drawn hands, poorly drawn face, mutation, deformed, blurry, dehydrated, bad anatomy, bad proportions, extra limbs, cloned face, disfigured, gross proportions, malformed limbs, missing arms, missing legs, extra arms, extra legs, fused fingers, too many fingers, long neck ',
          width: options.width ? options.width : 512,
          height: options.height ? options.height : 768,
          steps: options.steps?options.steps:20,
          guidance: options.guidance?options.guidance:10,
          seed: options.seed?options.seed:generateRandom9DigitNumber(),
          model: options.model?options.model: "realistic-vision-v3",
          scheduler: options.scheduler?options.scheduler:"dpmsolver++",
          output_format: options.output_format?options.output_format:"jpeg"
      })


      if (image) {
          writeFileSync( process.env.UPLOAD_PATH + id + `.` + outputFormat, image, 'base64')
          return await getImageUrl( id, outputFormat)
      } else {

          return null;
      }




  } catch (error) {

      console.log(error);
      return null;

  }


}

async function getBase64ImageFromURL(url: string): Promise<string> {
    try {

        if (url === null) return null;

        const response = await axios.get<ArrayBuffer>(url, {
            responseType: 'arraybuffer'
        });

        const imageBuffer = Buffer.from(response.data);

        console.log('image buffer')
        const image = sharp(imageBuffer);

        const metadata = await image.metadata();

        if (metadata.width > 1024 || metadata.height > 1024) {
            console.log('inside iamge resize')
            image.resize({
                width: 1024,
                height: 1024,
                fit: sharp.fit.inside,
                withoutEnlargement: true
            });

            const buffer = await image.toBuffer();
            return buffer.toString('base64');
        }

        return Buffer.from(response.data).toString('base64');

    } catch (error) {

        console.log('Error at getBase64ImageFromURL',error)
        return null;

    }

}

export async function createPromptUsingChatGPT (prompt: string): Promise<string> {



    const formatInstructions = parser.getFormatInstructions();

    const exampleData = "model name: dark-sushi-mix-v2-25, this model refers dark soul's meme in Chinese community. use this model when the prompt requires animation. model name: absolute-reality-v1-6, use this model when the prompt requires close up portrait of a person. model name: synthwave-punk-v2, use this model when the prompt has keywords such as sythwave, punk style.  Model name: openjourney-v4, use this model when the prompt contains midjourney or mid-jouney or open journey. Model name: realistic-vision-v3, use this model for more realistic 1girl, man, woman, or a person prompt. example prompt: RAW photo, face portrait photo of beautiful 26 y.o woman, cute face, wearing black dress, happy face, hard shadows, cinematic shot, dramatic lighting. Model name: neverending-dream, use this model if the prompt contains some dream words. Model name: eimis-anime-diffusion-v1-0, use this model if the prompt contains some animation keywords. Model name: xsarchitectural-interior-design, use this model if the prompt contains keywords such as architecture, lanscape, buildings and does not contain any human or person words. Model name: icbinp-final, use this model if the prompt contains keywords such as realistic, photography, art-station. use the lanscape mode - height:1024, width: 768 if the prompt is not about a person but outside. Use portait mode - height:768, width 1024  if the prompt contains 1girl, woman or a person as the subject. square mode - height:1024, width:1024 for if not able to decice. ";

    const client = await ZepClient.init(process.env.ZEP_API_URL);
    const collection = await client.document.getCollection(process.env.COLLECTION_NAME);

    const searchResults = await collection.search(
       {
          text: prompt,
       },
       3
    );

    const searchResult = getResults(searchResults);

    const model = new OpenAI({ temperature: 0, modelName: "gpt-3.5-turbo-16k-0613" });

    const chainA = loadQAStuffChain(model);
    const docs = [
        new Document({ pageContent:searchResult }),

    ];

    const resA = await chainA.call({
        input_documents: docs,
        question: "Can you create an image generation prompt based on " + prompt,
    });

    console.log('ResA: ', resA);


    // console.log('zep docs: ', searchResult);

    const llmprompt = new PromptTemplate({
        template:
        "use the prompt given by the user.  compare and match the prompt to pick one model suitable for this prompt... Also choose the mode potrait, lanscape or square will be suitable for the prompt and pick the height and width from the example. output prompt, model, height and width. default height=768 and default width=1024. default mode should be potrait mode. Here's the example for model names and size:" + exampleData +" Height and width cannot exceed more than 1024. use this example to select the correct model, height and width " +   " \n{format_instructions}\n{iprompt}",
        inputVariables: ["iprompt"],
        partialVariables: { format_instructions: formatInstructions },
      });



    const input = await llmprompt.format({
      iprompt: resA.text ,
    });

    const response = await model.call(input);

    console.log(input);
    console.log(response);

    return response;

}