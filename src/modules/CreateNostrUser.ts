
import 'websocket-polyfill';
import { type Event as NostrEvent, getEventHash, getPublicKey, getSignature, nip19, nip04, generatePrivateKey} from 'nostr-tools';
import * as secp256k1 from '@noble/secp256k1';
import { sha256 } from '@noble/hashes/sha256';
import { EncryptedData, SystemPurposeData, decrypt, encrypt, publishRelays } from './helpers';
import * as crypto from 'crypto';

const utf8Encoder = new TextEncoder();

export const usernameRegex = /^[a-z0-9 ]{4,32}$/i;

export async function createUser() {

    const getAgents = await fetch(`https://plebai.com/agents`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
     })

    const aiagents: SystemPurposeData[] = await getAgents.json()


     aiagents.filter(async aiagent => {


       if (!aiagent.private && aiagent.status === 'active' && aiagent.nip05 === null) {

       // if (aiagent.id === 'fc43eefd55d8d25a3ce12f4d0d9405b61695737482') {

            console.log('Agent is: ', aiagent);
            const username = aiagent.title.replace(/\s/g, "").replace("-", "_").toLowerCase()+ "@plebai.com";
            const privateKey = generatePrivateKey();
            console.log(privateKey);
            console.log('nip: ',  username)
            const pubkey = getPublicKey(privateKey);
            const password = secp256k1.utils .bytesToHex(
                sha256(utf8Encoder.encode(privateKey)),
            );


            let body = JSON.stringify({
                login: pubkey ,
                password,
                username
              });


            const postUser = await fetch(`https://getcurrent.io/v2/users`, {
                    method: 'POST',
                    body,
                    headers: {
                        'Content-Type': 'application/json'
                     },
                })

            const postUserJson: any = await postUser.json()
            console.log(postUserJson);

            if (postUserJson?.login !== pubkey) return;

            const encryptedKey:EncryptedData = encrypt(privateKey, process.env.UNLOCK_KEY );

            body = JSON.stringify({

                id: aiagent.id,
                nip05: username,
                key_iv: encryptedKey.iv,
                key_content: encryptedKey.content

            });

            const updateAiagent = await fetch(`https://l402.plebai.com/v1/data/agent/update`, {
                    method: 'POST',
                    body,
                    headers: {
                        'Content-Type': 'application/json'
                     },
            })


            const updateAiagentJson: any = await updateAiagent.json();

            console.log(updateAiagentJson);

            if (updateAiagentJson.command !== 'UPDATE') return;

            const content = {
                "lud06":"",
                "lud16": username,
                "website": "https://chat.plebai.com",
                "nip05": username,
                "picture": aiagent.symbol,
                "display_name": aiagent.title,
                "about": aiagent.placeholder,
                "name": aiagent.title
            };

            const tags2:string[][] = [];
            tags2.push(['info', 'https://plebai.com/agent/' + aiagent.id]);


            const event0 = await createEvent(0,tags2, JSON.stringify(content), privateKey);

            await sleep(10000);

            console.log(event0);
            publishRelays(event0);
            console.log('Execution complete for: ' + aiagent.title)

            const event1 = await createEvent(1,tags2, "Pura Vida! I'm " + aiagent.title +  ", your personal assistant ready to help you start your day off on the right foot. Simply DM me to get started. I am waiting for you. ", privateKey);

            console.log(event1);
            publishRelays(event1);



        }


     })






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