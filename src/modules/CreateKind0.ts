
import 'websocket-polyfill';
import { type Event as NostrEvent, getEventHash, getPublicKey, getSignature, nip19, nip04, generatePrivateKey} from 'nostr-tools';
import * as secp256k1 from '@noble/secp256k1';
import { sha256 } from '@noble/hashes/sha256';
import { EncryptedData, SystemPurposeData, decrypt, encrypt, publishRelays } from './helpers';
import * as crypto from 'crypto';

const utf8Encoder = new TextEncoder();

export const usernameRegex = /^[a-z0-9 ]{4,32}$/i;

export async function createKind0(id:string) {

    console.log('Starting...');
    const body = JSON.stringify({ id, })

    const postUser = await fetch(`https://l402.plebai.com/v1/data/agent`, {
                    method: 'POST',
                    body,
                    headers: {
                        'Content-Type': 'application/json'
                     },
    })



    const postUserJson: any = await postUser.json()
    console.log('JSON', postUserJson);

    const encryptedKey: EncryptedData = {
        iv: postUserJson.SystemPurposes[id].key_iv,
        content: postUserJson.SystemPurposes[id].key_content,
        key: process.env.UNLOCK_KEY

    }

    const username = postUserJson.SystemPurposes[id].title.replace(/\s/g, "").replace("-", "_").toLowerCase()+ "@plebai.com";

    console.log(encryptedKey);

    const decryptedKey = await decrypt(encryptedKey);

    console.log('decrypted key', decryptedKey);

    console.log(getPublicKey(decryptedKey));

    console.log(nip19.npubEncode(getPublicKey(decryptedKey)))

    console.log(postUserJson.SystemPurposes[id].placeholder);

    const content = {
        "lud06":"",
        "lud16": username,
        "website": "https://chat.plebai.com",
        "nip05": username,
        "picture": postUserJson.SystemPurposes[id].symbol,
        "display_name": postUserJson.SystemPurposes[id].title,
        "about": postUserJson.SystemPurposes[id].placeHolder,
        "name": postUserJson.SystemPurposes[id].title
    };


    const tags:string[][] = [];

    const event1 = await createEvent(0,tags, JSON.stringify(content), decryptedKey);

    console.log(event1);
    publishRelays(event1);
    console.log('Execution complete for: ' + postUserJson.SystemPurposes[id].title)






}

async function createEvent(eventId: number, tags:string[][], content:string, privateKey: string):Promise<NostrEvent>{

    const event: NostrEvent = {
        kind: eventId,
        pubkey: getPublicKey(privateKey),
        created_at: Math.floor(Date.now() / 1000),
        tags,
        content
    } as any;


    event.id = getEventHash(event);
    event.sig = getSignature(event, privateKey);

    console.log(eventId + ' Event: ', event);

    return event;

}




function sleep(ms: number) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }