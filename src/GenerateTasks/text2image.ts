import { type Event as NostrEvent, getEventHash, getPublicKey, getSignature } from 'nostr-tools';
import 'websocket-polyfill';
import {publishToRelays} from '../modules/helpers'
import { createGetImageWithPrompt } from '../modules/getimage/createText2Image';




export async function genImageFromText(event65005:NostrEvent):Promise<boolean> {



    try {

        let prompt = '';
        let  sizes:string[]=[];
        let output = ''
        let relays:string[] =[];

        event65005.tags.forEach(function(tag) {
            if (tag[0] === 'i' && tag[2] === 'text')  prompt = (tag[1]);
            if (tag[0] === 'param' && tag[1] === 'size')  sizes = tag[2].split('x');
            if (tag[0] === 'output') output = tag[1];
            if (tag[0] === 'relays')  relays = tag[1].split(',');

        });

        let content=''
        const tags:string[][] = [];
        tags.push(['e', event65005.id]);
        tags.push(['p', event65005.pubkey]);

        if (prompt !== ''){
            content = await createGetImageWithPrompt(prompt);

        }

        if (content === null || content === '') {
            content = 'Error when generating image. ';
            tags.push(["status", "error"]);
        } else {
            tags.push(["status", "success"]);
        }

        tags.push(["request", JSON.stringify(event65005)]);

        const event65001: NostrEvent = {
            kind: 65001,
            pubkey: getPublicKey(process.env.SK1),
            created_at: Math.floor(Date.now() / 1000),
            tags,
            content
        } as any;


        event65001.id = getEventHash(event65001);
        event65001.sig = getSignature(event65001, process.env.SK1);

        console.log('65001 Event: ', event65001);

        if (relays.length > 0) publishToRelays(relays, event65001);
        return true;

    } catch (error) {

        console.log('In catch with error: ', error)
        return false;

    }



}

