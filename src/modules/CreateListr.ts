import 'websocket-polyfill';
import { type Event as NostrEvent, getEventHash, getPublicKey, getSignature, nip19, nip04, generatePrivateKey} from 'nostr-tools';
import * as secp256k1 from '@noble/secp256k1';
import { sha256 } from '@noble/hashes/sha256';
import { EncryptedData, SystemPurposeData, createEvent, decrypt, encrypt, publishRelays } from './helpers';
import * as crypto from 'crypto';

const utf8Encoder = new TextEncoder();

export const usernameRegex = /^[a-z0-9 ]{4,32}$/i;

export async function createListr() {

    const keyId = "7f85a82b8cd1f4b98f4b5882862007741696162048";

    const body = JSON.stringify({

        "id": keyId,

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
        iv: postUserJson.SystemPurposes[keyId].key_iv,
        content: postUserJson.SystemPurposes[keyId].key_content,
        key: process.env.UNLOCK_KEY

    }

    const decryptedKey = await decrypt(encryptedKey);

    console.log('decrypted key', decryptedKey);

    console.log(getPublicKey(decryptedKey));

    console.log(nip19.npubEncode(getPublicKey(decryptedKey)))



    const getAgents = await fetch(`https://plebai.com/agents`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
     })

     const aiagents: SystemPurposeData[] = await getAgents.json()

     const tags:string[][] = [];

     aiagents.filter(async (aiagent, index) => {

            console.log(index, aiagent.title, aiagent.nip05)

            if (aiagent.nip05) {


                const result = await fetch(`https://plebai.com/.well-known/nostr.json?name=` + aiagent.nip05.split("@")[0], {
                    method: 'GET',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                 })

                 const resultJson: any = await result.json()
                 // console.log(resultJson);

                 const names = resultJson.names;

                 console.log('Npubs: ',nip19.npubEncode( names[aiagent.nip05.split("@")[0]]));

                 const ptags:string[] = ['p', names[aiagent.nip05.split("@")[0]]]

                 tags.push(ptags)

                 if (index === aiagents.length -1) {



                    tags.push(['d', 'plebai-agents']);
                    tags.push( [ 'description', 'PlebAI - AI agent List' ])
                    tags.push([ 'L', 'lol.listr.ontology' ])
                    tags.push([ 'l', 'People' ])
                    tags.push([ 'name', 'PlebAI-Agents' ]);

                    // console.log(tags);


                    const event30000 = await createEvent(30000,tags, '', decryptedKey);

                    // console.log(event30000);
                    publishRelays(event30000);



                }


            }




     })



}