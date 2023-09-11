import { LightningAddress } from "alby-tools";
import { InvoiceResponse } from "../typings/invoice";
import { sha256 } from "js-sha256";
import * as fs from 'fs';
import { type Event as NostrEvent, relayInit } from 'nostr-tools';
import { createReadStream, writeFileSync, unlink } from 'fs'
import FormData from 'form-data';
import axios from "axios";
import { IDocument } from "@getzep/zep-js";
import sharp from "sharp";

export const relayIds = [
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
  'wss://relay.nostr.wirednet.jp'

];

export const ModelIds = [
  "stable-diffusion-xl-v1-0",
  "dark-sushi-mix-v2-25",
  "absolute-reality-v1-6",
  "synthwave-punk-v2",
  "arcane-diffusion",
  "moonfilm-reality-v3",
  "moonfilm-utopia-v3",
  "moonfilm-film-grain-v1",
  "openjourney-v4",
  "realistic-vision-v3",
  "icbinp-final",
  "icbinp-relapse",
  "icbinp-afterburn",
  "xsarchitectural-interior-design",
  "mo-di-diffusion",
  "anashel-rpg",
  "realistic-vision-v1-3-inpainting",
  "eimis-anime-diffusion-v1-0",
  "something-v2-2",
  "icbinp",
  "analog-diffusion",
  "neverending-dream",
  "van-gogh-diffusion",
  "openjourney-v1-0",
  "realistic-vision-v1-3",
  "stable-diffusion-v1-5-inpainting",
  "gfpgan-v1-3",
  "real-esrgan-4x",
  "instruct-pix2pix",
  "stable-diffusion-v2-1",
  "stable-diffusion-v1-5"
]


export const relayId = [process.env.RELAY];




export function sendHeaders(stream: boolean): any {
    if (stream) {

          return  {
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


export function requestApiAccess(apiPath: string): { headers: HeadersInit, url: string } {
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

export function generateRandom10DigitNumber():number {
  const min = 1000000000; // 10-digit number starting with 1
  const max = 9999999999; // 10-digit number ending with 9

  const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
  return randomNumber;
}

export function generateRandom9DigitNumber():number {
  const min = 100000000; // 9-digit number starting with 1
  const max = 999999999; // 9-digit number ending with 9

  const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
  return randomNumber;
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function readRandomRow(filePath: string): string | null {
  try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.trim().split('\n');

      if (lines.length === 0) {
          return null;
      }
      const numberOfLines = content.split('\n');

      const randomIndex = getRandomInt(1, numberOfLines.length);
      return lines[randomIndex];
  } catch (err) {
      console.error('Error reading the file:', err);
      return null;
  }
}

export function publishToRelays(relays:string[], event: NostrEvent) {
  relays.forEach(async function(item) {
    console.log('publishing on', item);
    try {
      await  publishRelay(item, event);

    } catch (error) {
      console.log('in catch with error: ', error)
    }

});


}

export function publishRelays(event: NostrEvent) {
  relayIds.forEach(async function(item) {
        console.log('publishing on', item);
        try {
          await  publishRelay(item, event);

        } catch (error) {
          console.log('in catch with error: ', error)
        }

  });

}

export async function publishRelay(relayUrl:string, event: NostrEvent) {

  try {

    const pubrelay = relayInit(relayUrl);
    await pubrelay.connect();
    await pubrelay.publish(event);


  } catch (e) {

    console.log('in catch with error: ', e);

  }


}

export async function getImageUrl(id: string, outputFormat:string): Promise<string> {


  const form = new FormData();
  form.append('asset', createReadStream(process.env.UPLOAD_PATH + id + `.` + outputFormat));
  form.append("name", 'current/plebai/genimg/' + id + `.` + outputFormat);
  form.append("type", "image");

  const config = {
      method: 'post',
      url: process.env.UPLOAD_URL,
      headers: {
        'Authorization': 'Bearer ' + process.env.UPLOAD_AUTH,
        'Content-Type': 'multipart/form-data',
        ...form.getHeaders()
      },
      data: form
  };

  const resp = await axios.request(config);


  unlink(process.env.UPLOAD_PATH + id + `.` + outputFormat, (err) => {
    if (err) {
        console.log(err);
    }
  console.log('tmp file deleted');
  })

  return resp.data.data;

}

function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
          if (b.charAt(i - 1) === a.charAt(j - 1)) {
              matrix[i][j] = matrix[i - 1][j - 1];
          } else {
              matrix[i][j] = Math.min(
                  matrix[i - 1][j - 1] + 1,
                  matrix[i][j - 1] + 1,
                  matrix[i - 1][j] + 1
              );
          }
      }
  }
  return matrix[b.length][a.length];
}

// Function to find the string with the strongest match
export function findBestMatch(target: string, list: string[]): string {
  let minDistance = Infinity;
  let bestMatch = "";

  for (const str of list) {
      const distance = levenshtein(target, str);
      if (distance < minDistance) {
          minDistance = distance;
          bestMatch = str;
      }
  }

  return bestMatch;
}

export function closestMultipleOf256(num: number): number {
  // Round to the nearest integer in case of floating point numbers.
  num = Math.round(num);

  const remainder = num % 256;
  if (remainder === 0) {
      return num; // The number is already a multiple of 256.
  }

  if (remainder <= 128) {
      return num - remainder; // Round down (or up for negative numbers)
  } else {
      return num + (256 - remainder); // Round up (or down for negative numbers)
  }
}

export function isValidURL(str: string): boolean {
  try {
      const url = new URL(str);
      if (url.protocol === 'https:') return true;
  } catch (_) {
      return false;
  }

  return false;
}

export function getResults(results: IDocument[]): string {

  let data=''
  for (const result of results) {
     data = data + " " + result.content;
  }

  return data;
}


export async function getBase64ImageFromURL(url: string): Promise<string> {
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

export function saveBase64AsImageFile(filename: string, base64String: string) {
  // Convert base64 string to a buffer
  const buffer = Buffer.from(base64String, 'base64');

  // Write buffer to a file
  fs.writeFileSync(process.env.UPLOAD_PATH +filename, buffer);
}

export function doesStringAppearMoreThanFiveTimes(arr: string[], target: string): boolean {
  let count = 0;

  for (const str of arr) {
      if (str === target) {
          count++;
      }

      console.log('Count for: ', target + ': ' + count);

      if (count > 5) {
          return true;
      }
  }

  return false;
}