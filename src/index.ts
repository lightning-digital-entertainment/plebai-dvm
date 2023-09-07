
import {SimplePool} from 'nostr-tools';
import 'websocket-polyfill';
import * as dotenv from 'dotenv';
import { genImageFromText } from './GenerateTasks/event65005';
import { createGetImage, createGetImageWithPrompt } from './modules/getimage/createImage';
import { createNIP94Event } from './modules/nip94event/createEvent';


// Loading environment variables from the .env file
dotenv.config();




// Defining an asynchronous function run()
async function run() {



    // Logging the RELAY environment variable
    console.log('Starting to subscribe with', process.env.RELAY)

    // Creating an array of relays using the RELAY environment variable
    const relays = [process.env.RELAY,]

    const pool= new SimplePool();

    // Subscribing to a pool of relays
    const sub = pool.sub(relays, [{ limit: 0, kinds: [65005]}]);
    // Removing all listeners from the 'event' event
    sub.off('event', async event => { return})

    // Adding a listener to the 'event' event
    sub.on('event', async event => {

        // Logging the event
        console.log(event);

        // Generating an image from the event's text
        if (await genImageFromText(event)) {
          // Logging the success message when the image generation is successful
          console.log('Image generation success for event ID: ', event.id)
        } else {
          // Logging the error message when the image generation fails
          console.log('Image generation failed for event ID: ', event.id)
        }
    })
}

async function runTest() {

  // const prompt = 'photo of top model 18 y.o, cyberpunk art, gothic art, extremely high quality RAW photograph, detailed background, intricate, Exquisite details and textures, highly detailed, ultra detailed photograph, warm lighting, 4k, sharp focus, high resolution, detailed skin, detailed eyes, 8k uhd, dslr, high quality, film grain, ';

  const prompt = ' change the hair color to pink'

  // const prompt = 'High resolution photography interior design, dreamy sunken living room conversation pit, wooden floor, small windows opening onto the garden, bauhaus furniture and decoration, high ceiling, beige blue salmon pastel palette, interior design magazine, cozy atmosphere; 8k, intricate detail, photorealistic, realistic light, wide angle, kinkfolk photography, A+D architecture';
  const imageUrl = 'https://i.current.fyi/current/app/resizedn.png'
  const content = await createGetImageWithPrompt(prompt, imageUrl);

  // const content = await createNIP94Event('https://i.current.fyi/current/plebai/genimg/d6cf2189-b3a3-4c1c-856e-a2989a2ec1cf.png', null);

  console.log(content);

}

run().catch(console.log);