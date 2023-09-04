
import {SimplePool} from 'nostr-tools';
import 'websocket-polyfill';
import * as dotenv from 'dotenv';
import { genImageFromText } from './GenerateTasks/text2image';

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
