
import 'websocket-polyfill';
import { type Event as NostrEvent, getEventHash, getPublicKey, getSignature, nip19, nip04} from 'nostr-tools';
import * as secp256k1 from '@noble/secp256k1';
import { sha256 } from '@noble/hashes/sha256';
import { EncryptedData, decrypt, encrypt, publishRelays } from './helpers';
import * as crypto from 'crypto';

const utf8Encoder = new TextEncoder();

export async function createUser() {

    const {type, data}  = nip19.decode('nsec1esusayn42tn6pc22vn2xefn8tg6089rzucg2mqw82x4qtqu95cya79ehww');


    const encryptedKey:EncryptedData = encrypt(data, process.env.UNLOCK_KEY );

    console.log('Encrypted nsec', encryptedKey);

    const decryptedKey = await decrypt(encryptedKey);

    console.log('decrypted key', decryptedKey);

    // const secretKey = crypto.randomBytes(32).toString('hex');

    // console.log(secretKey);

    console.log('private key: ', data);
    const pubkey = getPublicKey(data);
    console.log('npub: ', nip19.npubEncode(pubkey));
    console.log('pubkey: ', pubkey);
    console.log('nsec', nip19.nsecEncode(data));

    const password = secp256k1.utils.bytesToHex(
        sha256(utf8Encoder.encode(data)),
      );

    console.log('password: ', password);

    const content = {
        "lud06":"",
        "lud16": "ai@plebai.com",
        "website": "https://chat.plebai.com",
        "nip05": "ai@plebai.com",
        "picture": "https://i.current.fyi/current/app/plebai_logo.png",
        "display_name": "PlebAI",
        "about": "PlebAI - Plebs version of ChatGPT - Silicon valley elites are pouring billions of dollars in building closed AI systems that can ingest all of our data. Then scare politicians into creating regulations that install them as overlords. They will not win in that game because of millions of Plebs like us band together, build in public (#buildinpublic), democratize AI access for all and beat them in their own game.",
        "name": "PlebAI"
    };

    const body = JSON.stringify({
        login: pubkey ,
        password,
        username: "ai@plebai.com"
      });


    const result = await fetch(`https://getcurrent.io/v2/users`, {
        method: 'POST',
        body,
        headers: {
          'Content-Type': 'application/json'
        },
     })

     const resultJson: any = await result.json()
     console.log(resultJson);




    const tags2:string[][] = [];
    tags2.push(['info', 'https://plebai.com/agents']);


    const event0 = await createEvent(0,tags2, JSON.stringify(content), data);

    console.log(event0);
    publishRelays(event0);
    console.log('Sent event 0')

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




