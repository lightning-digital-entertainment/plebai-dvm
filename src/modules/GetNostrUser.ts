import 'websocket-polyfill';
import { type Event as NostrEvent, getEventHash, getPublicKey, getSignature, nip19, nip04, generatePrivateKey} from 'nostr-tools';
import * as secp256k1 from '@noble/secp256k1';
import { sha256 } from '@noble/hashes/sha256';
import { EncryptedData, SystemPurposeData, createEvent, decrypt, encrypt, publishRelays } from './helpers';
import * as crypto from 'crypto';

const utf8Encoder = new TextEncoder();

export const usernameRegex = /^[a-z0-9 ]{4,32}$/i;

export async function getUser() {

    console.log('Starting...');

    const id = "GenImage";

    const body = JSON.stringify({

        id,

    })

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

    console.log(encryptedKey);

    const decryptedKey = await decrypt(encryptedKey);

    console.log('decrypted key', decryptedKey);

    console.log(getPublicKey(decryptedKey));

    console.log(nip19.npubEncode(getPublicKey(decryptedKey)))


    const content = "Pura Vida! I'm " + postUserJson.SystemPurposes.DocGPT.title +  ", your personal assistant ready to help you start your day off on the right foot. Simply DM me to get started. I am waiting for you. "


    const tags:string[][] = [];

    const event1 = await createEvent(1,tags, JSON.stringify(content), decryptedKey);

    console.log(event1);
    // publishRelays(event1);
    // console.log('Execution complete for: ' + aiagent.title)






}