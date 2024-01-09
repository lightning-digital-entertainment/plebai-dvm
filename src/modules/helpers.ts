import { LightningAddress } from "alby-tools";
import { InvoiceResponse } from "../typings/invoice";
import { sha256 } from "js-sha256";
import * as fs from 'fs';
import { type Event as NostrEvent, relayInit, getPublicKey, getEventHash, getSignature } from 'nostr-tools';
import { createReadStream, writeFileSync, unlink } from 'fs'
import FormData from 'form-data';
import axios from "axios";
import { IDocument } from "@getzep/zep-js";
import sharp from "sharp";
import * as crypto from 'crypto';

export const relayIds = [
  'wss://relay.current.fyi',
  'wss://nostr1.current.fyi',
  'wss://nostr-pub.wellorder.net',
  'wss://relay.damus.io',
  'wss://nostr-relay.wlvs.space',
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
  'wss://relay.nostr.wirednet.jp',
  'wss://purple.pages',
  'wss://realy.nostr.band',
  'wss://wc1.current.ninja',
  'wss://pablof7z.nostr1.com',
  'wss://relay.f7z.io',
  'wss://relay.conxole.io'

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

export type SubscriptionData = {
  request_date: string;
  subscriber: {
      entitlements: Record<string, any>;
      subscriptions: Record<string, {
          expires_date: string;
          is_sandbox: boolean;
          ownership_type: string;
      }>;
  };
};



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

export function generateRandom5DigitNumber():number {
  const min = 1000; // 4-digit number starting with
  const max = 10000; // 5-digit number ending with

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

export function removeKeyword(inputString: string): { keyword: string; modifiedString: string } {
  const keywords = ['/photo', '/midjourney'];
  const keyword = keywords.find(keyword => inputString.includes(keyword));
  const modifiedString = inputString.replace(keyword, '');
  return {keyword, modifiedString};
}


export function encrypt(text: string, key:string): EncryptedData {
  const algorithm = 'aes-256-ctr';
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(algorithm, Buffer.from(key, 'hex'), iv);

  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

  return {
    iv: iv.toString('hex'),
    content: encrypted.toString('hex'),
    key
  };
}

export async function decrypt(data:EncryptedData): Promise<string> {
  // Retrieve the encrypted password and key from the database

  const decipher = crypto.createDecipheriv(
    'aes-256-ctr',
    Buffer.from(data.key, 'hex'),
    Buffer.from(data.iv, 'hex')
  );

  const decrypted = Buffer.concat([decipher.update(Buffer.from(data.content, 'hex')), decipher.final()]);

  return decrypted.toString();
}

export interface EncryptedData {
  iv: string;
  content: string;
  key: string;
}

export type SystemPurposeData = {
  id: string,
  title: string;
  description: string
  systemMessage: string;
  symbol: string;
  examples?: string[];
  highlighted?: boolean;
  placeholder: string;
  chatLLM: string;
  llmRouter: string;
  convoCount: number;
  temperature:number,
  satsPay: number;
  maxToken: number;
  paid: boolean;
  private: boolean;
  status: string;
  createdBy: string;
  updatedBy: string;
  chatruns: number,
  key_iv:string,
  key_content:string,
  nip05:string

}

export async function createEvent(eventId: number, tags:string[][], content:string, privateKey: string):Promise<NostrEvent>{

  const event: NostrEvent = {
      kind: eventId,
      pubkey: getPublicKey(privateKey),
      created_at: Math.floor(Date.now() / 1000)+1,
      tags,
      content
  } as any;


  event.id = getEventHash(event);
  event.sig = getSignature(event, privateKey);

  console.log(eventId + ' Event: ', event);

  return event;

}

export async function publishProcessingEvent(pubkey: string, eventId:string, privateKey: string) {

  const tags2:string[][] = [];
  tags2.push(['e', eventId]);
  tags2.push(['p', pubkey]);
  tags2.push(['status','processing', "Processing started"]);

  const event7000 = await createEvent(7000,tags2, 'Payment received. Starti ng to generate...', privateKey);

  try {

    publishRelays(event7000);

  } catch (error) {
        console.log(error);
  }

}

export async function getAgents():Promise<SystemPurposeData[]>{

    try {

      const getAgents = await fetch(process.env.PLEBAI_AGENTS_LINK, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
    })

    return await getAgents?.json();

    } catch (error) {

      console.log('Error at catch: ', error)
      return null;

    }




}

export async function getAgentKey(id:string):Promise<string>{

  try {

    const body = JSON.stringify({id})

    const postUser = await fetch(process.env.PLEBAI_AGENT_LINK + '/v1/data/agent', {
                    method: 'POST',
                    body,
                    headers: {
                        'Content-Type': 'application/json'
                    },
    })

    if (!postUser) return null;

    const postUserJson: any = await postUser.json()



    const encryptedKey: EncryptedData = {
        iv: postUserJson.SystemPurposes[id].key_iv,
        content: postUserJson.SystemPurposes[id].key_content,
        key: process.env.UNLOCK_KEY

    }


  return await decrypt(encryptedKey);

  } catch (error) {

    console.log('Error at catch: ', error)
    return null;

  }

}

export async function getAgent(id:string):Promise<string>{

  try {

    const body = JSON.stringify({id})

    const postUser = await fetch(process.env.PLEBAI_AGENT_LINK + '/v1/data/agent', {
                    method: 'POST',
                    body,
                    headers: {
                        'Content-Type': 'application/json'
                    },
    })

    if (!postUser) return null;

    return await postUser.json()

  } catch (error) {

    console.log('Error at catch: ', error)
    return null;

  }

}

export function npubfromstring (input:string) {

  const regex = /nostr:(npub[\w]+)/;
  const match = input.match(regex);
  if (match && match[1]) return match[1];
  return null;

}

export async function isSubscriptionValid(pubkey:string): Promise<boolean> {

  try {

    const getSubscription = await fetch(process.env.REVCAT_API_URL + '/subscribers/' + pubkey, {
      method: 'GET',
      headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + process.env.REVCAT_API_KEY

      },
    })

    const getSubscriptionData: SubscriptionData = await getSubscription.json();

    console.log(getSubscriptionData);

    const today = new Date();
    const subscription = getSubscriptionData.subscriber.subscriptions.amped1mon;

    if (!subscription) return false;

    const expiresDate = new Date(subscription.expires_date);

    return expiresDate > today &&
           !subscription.is_sandbox &&
           subscription.ownership_type.toUpperCase() === 'PURCHASED';

  } catch (error) {

    console.log(error);
    return false;

  }


}

