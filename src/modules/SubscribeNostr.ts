import { SimplePool, getPublicKey, nip04, type Event, nip19 } from "nostr-tools";
import { SubscriptionData, createEvent, getAgent, getAgentKey, getAgents, isSubscriptionValid, npubfromstring, publishProcessingEvent, publishRelays, relayId, relayIds } from "./helpers";


type message = {
    role: string;
    content:string;
    created_at: number;
}


export async function subscribeNostr(): Promise<void>   {



    // Logging the RELAY environment variable
    console.log('Starting to subscribe with relays: ', relayIds)

    // Creating an array of relays using the RELAY environment variable
    const relays = relayIds;

    // const keys: string[] = [];

    const pool= new SimplePool();

    const aiAgents = await getAgents();

    const privateKeys:[string, string, string][] = [];
    const pubKeys:string[] = [];

    for (const [index, aiagent] of aiAgents.entries()) {
            let key = null;
            if (aiagent.nip05 !== null) {
            key = await getAgentKey(aiagent.id);
            }
            if (key !== null) {

                privateKeys.push([getPublicKey(key),key, aiagent.id]);
                pubKeys.push(getPublicKey(key));
            }
    }

    const getPrivateKeyByPublicKey = (publicKey: string): string | null => {
        const filteredKeys = privateKeys.filter(([pubKey, _]) => pubKey === publicKey);
        if (filteredKeys.length > 0) return filteredKeys[0][1];
        return null; // Return null if no matching public key is found
    };

    const getAgentIdByPublicKey = (publicKey: string): string | null => {
        const filteredKeys = privateKeys.filter(([pubKey, _, __]) => pubKey === publicKey);
        if (filteredKeys.length > 0) return filteredKeys[0][2];
        return null; // Return null if no matching public key is found
    };

    const getEventConversations = async (kind:number, ptags: string[]): Promise<Event[]> => {
        const events: any[] = [];

        await new Promise<void>((resolve) => {
          const sub = pool.sub(relays, [{ limit:10, kinds: [kind], authors: ptags, '#p': ptags }]);

          sub.on('event', (event) => {
            // console.log('inside event: ', event)
            events.push(event);
          });

          sub.on('eose', () => {
            resolve();
          });
        });

        return events;
    };

    const sendInvoice = async (event:Event, aiagent: any, ptag:string, count:number):Promise<boolean> => {

        try {

            // check if the user has active subscription
            if (await isSubscriptionValid(event.pubkey)) return false;

            const tags:string[][] = [ ];

            tags.push(['p', ptag]);
            tags.push(['e', event.id]);
            // tags.push(['relays',  'wss://relay.current.fyi', 'wss://nostr1.current.fyi', 'wss://nos.lol', 'wss://relay.primal.net',  'wss://wc1.current.ninja'])
            const relayTags:string[] = ['relays'];
            relayIds.map(relay => relayTags.push(relay));
            tags.push(relayTags)

            const event9734 = await createEvent(9734,tags, '', (getPrivateKeyByPublicKey(ptag)));


            const url = aiagent.SystemPurposes[getAgentIdByPublicKey(ptag)]?.nip05.includes("@")
                ? 'https://' + aiagent.SystemPurposes[getAgentIdByPublicKey(ptag)]?.nip05.split("@")[1] + '/process-static-charges/' +  aiagent.SystemPurposes[getAgentIdByPublicKey(ptag)]?.nip05.split("@")[0] + '?amount=' + aiagent.SystemPurposes[getAgentIdByPublicKey(ptag)]?.satsPay*1000
                + '&nostr=' + JSON.stringify(event9734):'';

            console.log(url);

            const invoiceResponse = await fetch(url, {method: 'GET'});

            const invoiceResponseJson  = await invoiceResponse.json()
            console.log(invoiceResponseJson);

            if (invoiceResponseJson.pr) {

                const tags:string[][] = [ ];
                tags.push(['p', event.pubkey]);

                let pubEvent:any;

                if (event.kind === 5100 || event.kind === 5101) {
                    tags.push(['e', event.id]);
                    tags.push(['alt', 'NIP90 DVM AI task text-to-image requires payment of min 50 Sats. ']);
                    tags.push(['status', 'payment-required']);
                    tags.push(['amount', aiagent.SystemPurposes[getAgentIdByPublicKey(ptag)]?.satsPay*1000 +'', invoiceResponseJson.pr]);

                    pubEvent = await createEvent(7000,tags, 'NIP90 DVM AI task text-to-image requires payment of min 50 Sats. 🧡', (getPrivateKeyByPublicKey(ptag)));


                } else {

                    tags.push(['count', ''+ count]);
                    tags.push(['invoice', ''+ invoiceResponseJson.pr]);

                    // tags.push(['verify', invoiceResponseJson.verify.lastIndexOf('/')]);

                    const invMessage = 'Please pay this amount using a lightning wallet to get response from ' + aiagent.SystemPurposes[getAgentIdByPublicKey(ptag)]?.title + ' ' + invoiceResponseJson.pr;
                    console.log(invMessage);
                    const encryptContent = await nip04.encrypt(getPrivateKeyByPublicKey(ptag), event.pubkey, invMessage )

                    pubEvent = await createEvent(4,tags, encryptContent, (getPrivateKeyByPublicKey(ptag)));

                }



                publishRelays(pubEvent);

            }

            return(true)

        } catch (error) {

            console.log(error)

        }



    }

    class ProcessEvent{

        constructor(public event: Event) {

        }

        async processEvent () {

            let count = 0;
            let ptag:any='';
            const event = this.event;

        try {

            if (event.kind === 1) {
                const npub = npubfromstring(event.content);

                if (!npub) return;


                const { type, data } = nip19.decode(npub);
                ptag = data;

            } else if (event.kind === 5100) {

                ptag = '04f74530a6ede6b24731b976b8e78fb449ea61f40ff10e3d869a3030c4edc91f';
            }  else if (event.kind === 5101) {

                ptag = '909ae069f959a1091fe3a7d914723731e97bd5ee72e0e13c4720d04a1bf66dd2';
            } else if (event.kind === 5050) {

                ptag = '4aa7239b5396360980e0759b1a149490d1e4a1e3a441b69cd7f1b2925f8a5e77';
            }
            else {
                ptag = event.tags.find(([k]) => k === 'p')?.[1] || '';

            }

        } catch (error) {
            console.log('Not able to get npub with error: ', error)
        }

        if (ptag==='') return;

        console.log('ptag: ', ptag);

        const aiagent: any = await getAgent(getAgentIdByPublicKey(ptag));

        if (!aiagent) return;

        // console.log(aiagent);
        // Send invoice back to the user if the AI agent require payment
        if (aiagent.SystemPurposes[getAgentIdByPublicKey(ptag)]?.paid && event.kind !== 9735) {


            const subsStatus:boolean = await sendInvoice(event, aiagent, ptag, 1);
            if (subsStatus) return;

        }

        // if this is a paid response event, then get the original event and continue
        if (event.kind === 9735) {
            const etag:string = event.tags.find(([k]) => k === 'e')?.[1] || '';
            // event = await getEvent(etag);
            const sourceEvent = await getEvent(etag);

            event.id = sourceEvent.id;
            event.pubkey = sourceEvent.pubkey;
            event.tags = sourceEvent.tags;
            event.sig = sourceEvent.sig;
            event.created_at = sourceEvent.created_at;
            event.kind = sourceEvent.kind;
            count=1;

            console.log('sourceEvent from 9735: ', event);

            publishProcessingEvent(event.pubkey, event.id, getPrivateKeyByPublicKey(ptag));
        }



        const eventConversations = await getEventConversations(event.kind, [event.pubkey, ptag]);
        eventConversations.sort((a, b) => b.created_at - a.created_at);
        console.log('Event Conversaions: ', eventConversations);

        if (eventConversations.length === 0) eventConversations.push(event);


        const messages:message[] = [];

        const msg:message = {
            role: 'system',
            content:aiagent.SystemPurposes[getAgentIdByPublicKey(ptag)]?.systemMessage,
            created_at:0


        }

        messages.push(msg);

        for (const [index, eventConversation] of eventConversations.entries()) {
                if (index === 5) break;

                if (count===0) {
                    const countTag:string = eventConversation.tags.find(([k]) => k === 'count')?.[1] || '';
                    console.log('countTag: ', countTag);
                    if (countTag) count = parseInt(countTag,10) + 1;
                    console.log('Updated count: ', count);

                }

                try {

                    let contentString = '';

                    if (event.kind === 4) {
                        contentString = await nip04.decrypt(getPrivateKeyByPublicKey(ptag), (eventConversation.pubkey === ptag)?event.pubkey:eventConversation.pubkey, eventConversation.content);
                    } else if (String(event.kind).startsWith('5')) {
                        contentString = eventConversation.tags.find(([k]) => k === 'i')?.[1] || '';
                    } else {
                        contentString = eventConversation.content.replace(/nostr:(npub1[\w]+)/g, '');
                    }
                    const input:message = {
                        role: eventConversation.pubkey===ptag?'assistant':'user',
                        content: contentString,
                        created_at:eventConversation.created_at

                    }

                    if (!input.content.startsWith('Please pay this amount')) messages.push(input);



                } catch (error) {
                    // ignore error and move on
                    console.log(error)
                }

        }
        if (!aiagent.SystemPurposes[getAgentIdByPublicKey(ptag)]?.paid && count >= aiagent.SystemPurposes[getAgentIdByPublicKey(ptag)]?.convoCount) {

            const subsStatus:boolean = await sendInvoice(event, aiagent, ptag, count);
            if (subsStatus) return;

        }

        messages.sort((a, b) => a.created_at - b.created_at);

        console.log(messages);

        const response = await getllmResponse(event, aiagent, ptag, messages)

        const tags:string[][] = [ ];

        if (count===0)count=1;

        tags.push(['p', event.pubkey]);
        tags.push(['count',  count + '']);

        let pubEvent:Event;

        if (event.kind === 4) {

            const encryptContent = await nip04.encrypt(getPrivateKeyByPublicKey(ptag), event.pubkey, response)
            pubEvent = await createEvent(4,tags, encryptContent, (getPrivateKeyByPublicKey(ptag)));
        }

        if (event.kind === 1) {
            tags.push(['e', event.id, '','reply'])
            event.tags.forEach(function(tag) {
                if (tag[0] === 'e')  tags.push(tag);
                if (tag[0] === 'p' && tag[1] !== event.pubkey && tag[1] !== ptag) tags.push(tag);

            });
            pubEvent = await createEvent(1,tags, response, (getPrivateKeyByPublicKey(ptag)));
        }

        if (String(event.kind).startsWith('5')) {
            tags.push(['e', event.id]);
            tags.push(['p', event.pubkey]);
            tags.push(['alt', 'This is the result of a NIP90 DVM AI task with kind ' + event.kind]);
            tags.push(['status', 'success']);
            tags.push(['i', event.tags.find(([k]) => k === 'i')?.[1] || '' ])
            tags.push(['request', JSON.stringify(event)])

            pubEvent = await createEvent(event.kind+1000,tags, response, (getPrivateKeyByPublicKey(ptag)));

        }

        try {

            publishRelays(pubEvent);

        } catch (error) {
            console.log(error);
        }




        }



    }

    const getEvent = async (etag: string): Promise<Event> => {

        let event:Event;
        await new Promise<void>(async (resolve) => {
            event = await pool.get(relays, {
                ids: [etag],
              })

            resolve();
        });

        return event;
    };

    const getllmResponse = async (event:Event, aiagent: any, ptag:string, messages:message[]):Promise<string> => {

        try {

            messages = messages.map((item: any) => {
                const { created_at, ...rest } = item;
                return rest;
            });

            const body = JSON.stringify ({
                model: "string",
                llm_router: aiagent.SystemPurposes[getAgentIdByPublicKey(ptag)]?.llmRouter,
                messages,
                temperature: aiagent.SystemPurposes[getAgentIdByPublicKey(ptag)]?.temperature,
                app_fingerprint: event.pubkey,
                messageId: event.id,
                conversationId: event.id,
                system_purpose: getAgentIdByPublicKey(ptag),
                "top_p": 0.95,
                "n": 1,
                stream: false,
                max_tokens: aiagent.SystemPurposes[getAgentIdByPublicKey(ptag)]?.maxToken,
                "presence_penalty": 0,
                "frequence_penalty": 0,
                "logit_bias": {},
                "user": event.pubkey
            })

            console.log('body', body)

            const postUser = await fetch(process.env.PLEBAI_AGENT_LINK + '/v1/chat/completions', {
                method: 'POST',
                body,
                headers: {
                    'Content-Type': 'application/json'
                },
            })

            return await postUser.text();

        } catch (error) {
            console.log('Error calling llm: ', error)
            return 'With a roaring thunder, Generative AI failed. To request refund, Please contact us on Discord. '

        }



    }

    const subdvm = pool.sub(relays, [{ since: (Math.floor(Date.now() / 1000)), limit:1, kinds: [5100, 5101, 5050]}]);

    subdvm.on('event', async event => {
        console.log(event);
        try {

            const instance = new ProcessEvent(event);
            instance.processEvent();

        } catch (error) {
            console.log('Error when calling ProcessEvent for eventId: ' + event.id , error);

        }

    });
    subdvm.off('event', async event => {console.log('off: ', event); })

    // Subscribing to a pool of relays for kind 1,4 and 9735 events filtered by pubkeys
    const sub = pool.sub(relays, [{ since: (Math.floor(Date.now() / 1000)), kinds: [1,4,9735], '#p':pubKeys}]);
    // Adding a listener to the 'event' event
    sub.on('event', async event => {
        console.log(event);
        console.log(event);
        try {

            const instance = new ProcessEvent(event);
            instance.processEvent();

        } catch (error) {
            console.log('Error when calling ProcessEvent for eventId: ' + event.id , error);

        }

    })
    // Removing all listeners from the 'event' event
    sub.off('event', async event => {console.log('off: ', event); })

    //




}







