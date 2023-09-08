import { type Event as NostrEvent, getEventHash, getPublicKey, getSignature} from 'nostr-tools';
import 'websocket-polyfill';
import {isValidURL, publishToRelays, relayId} from '../modules/helpers'
import { createGetImageWithPrompt } from '../modules/getimage/createImage';
import { createNIP94Event, sizeOver1024 } from '../modules/nip94event/createEvent';




export async function genImageFromText(event65005:NostrEvent):Promise<boolean> {



    try {

        let prompt = '';
        let  sizes:string[]=[];
        let output = ''
        let relays:string[] =[];
        let imageurl:string = null;

        event65005.tags.forEach(function(tag) {
            if (tag[0] === 'i' && tag[2] === 'text')  prompt = (tag[1]);
            if (tag[0] === 'i' && tag[2] === 'url')  imageurl= (tag[1]);
            if (tag[0] === 'param' && tag[1] === 'size')  sizes = tag[2].split('x');
            if (tag[0] === 'output') output = tag[1];
            if (tag[0] === 'relays')  relays = tag.filter(relayId => relayId.startsWith('wss://'));

        });

        let content=''
        const tags:string[][] = [];
        tags.push(['e', event65005.id]);
        tags.push(['p', event65005.pubkey]);

        

        if (prompt !== '' ){

            console.log('Starting to process...')
            const tags2:string[][] = [];
            tags2.push(['e', event65005.id]);
            tags2.push(['p', event65005.pubkey]);
            tags2.push(['status', 'processing']);
            tags2.push(['amount', "50000"])

            const event65000 = await createEvent(65000,tags2, '');
            if (relays.length > 0) publishToRelays(relays, event65000);
            console.log('Sent event 65000')

            content = await createGetImageWithPrompt(prompt, imageurl);

        }

        if (content === null || content === '') {

            content = 'Error: Error when generating image. ';
            

            tags.push(["status", "error"]);
        } else {
            tags.push(["status", "success"]);
        }

        tags.push(["request", JSON.stringify(event65005)]);

        const event65001 = await createEvent(65001, tags, content);

        if (relays.length > 0) publishToRelays(relays, event65001);

        if (isValidURL(content))  await createNIP94Event(content, event65005.pubkey);

        return true;

    } catch (error) {

        console.log('In catch with error: ', error)
        return false;

    }



}

async function createEvent(eventId: number, tags:string[][], content:string):Promise<NostrEvent>{

    const event: NostrEvent = {
        kind: eventId,
        pubkey: getPublicKey(process.env.SK1),
        created_at: Math.floor(Date.now() / 1000),
        tags,
        content
    } as any;


    event.id = getEventHash(event);
    event.sig = getSignature(event, process.env.SK1);

    console.log(eventId + ' Event: ', event);

    return event;

}

