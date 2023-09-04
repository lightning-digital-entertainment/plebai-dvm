
import { v4 as uuidv4 } from 'uuid';
import { writeFileSync} from 'fs'
import sdwebui from "./sdwebui"
import { SamplingMethod } from "./types"
import { generateRandom10DigitNumber, getImageUrl } from '../helpers';



export async function createImage (prompt: string, width?: number, height?:number, hiresImage?:boolean ): Promise<string> {


    try {

        const client = sdwebui()
        const id = uuidv4()

        let hires=null;

        if (hiresImage) {
            hires={ steps: 20,
              denoisingStrength: 0.7,
              upscaler: '4x-UltraSharp',
              upscaleBy: 2,
              resizeWidthTo: 1024,
              resizeHeigthTo: 1536}


        }


        const { images } = await client.txt2img({
          prompt: prompt?prompt:'Photo of a classic red mustang car parked in las vegas strip at night',
          negativePrompt: '(NSFW, Chinese, deformed, distorted, disfigured:1.3), poorly drawn, bad anatomy, wrong anatomy, extra limb, missing limb, floating limbs, (mutated hands and fingers:1.4), disconnected limbs, mutation, mutated, ugly, disgusting, blurry, amputation, CyberRealistic_Negative-neg, (Chinese, deformed, distorted, disfigured:1.3), poorly drawn, bad anatomy, wrong anatomy, extra limb, missing limb, floating limbs, (mutated hands and fingers:1.4), disconnected limbs, mutation, mutated, ugly, disgusting, blurry, amputation, CyberRealistic_Negative-neg, ',
          samplingMethod: SamplingMethod.DPMPlusPlus_2M_Karras,
          width: width?width:512,
          height: height?height:768,
          steps: 20,
          batchSize: 1,
          seed: generateRandom10DigitNumber(),
          restoreFaces: true,
          hires,

        })

        images.forEach((image, i) =>
          writeFileSync( process.env.UPLOAD_PATH + id + `.png`, images[i], 'base64')
        )

        return await getImageUrl(id, 'png')


      } catch (err) {
        console.error(err)

        return null;

      }





}






