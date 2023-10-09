import { SimplePool, getPublicKey, nip04, type Event } from "nostr-tools";
import { createEvent, getAgent, getAgentKey, getAgents, publishRelays, relayId, relayIds } from "./helpers";


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

    const getEventConversations = async (ptags: string[]): Promise<Event[]> => {
        const events: any[] = [];

        await new Promise<void>((resolve) => {
          const sub = pool.sub(relays, [{ limit:10, kinds: [4], authors: ptags, '#p': ptags }]);

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

    const sendInvoice = async (event:Event, aiagent: any, ptag:string) => {

        const tags:string[][] = [ ];

        tags.push(['p', ptag]);
        tags.push(['e', event.id]);
        tags.push(['relays',  'wss://relay.current.fyi', 'wss://nostr1.current.fyi', 'wss://nos.lol', 'wss://relay.primal.net',  'wss://wc1.current.ninja'])
        const event9734 = await createEvent(9734,tags, '', (getPrivateKeyByPublicKey(ptag)));


        const url = aiagent.SystemPurposes[getAgentIdByPublicKey(ptag)].nip05.includes("@")
            ? 'https://' + aiagent.SystemPurposes[getAgentIdByPublicKey(ptag)].nip05.split("@")[1] + '/process-static-charges/' +  aiagent.SystemPurposes[getAgentIdByPublicKey(ptag)].nip05.split("@")[0] + '?amount=' + aiagent.SystemPurposes[getAgentIdByPublicKey(ptag)].satsPay*1000
            + '&nostr=' + JSON.stringify(event9734):'';

        console.log(url);

        const invoiceResponse = await fetch(url, {method: 'GET'});

        const invoiceResponseJson  = await invoiceResponse.json()
        console.log(invoiceResponseJson);

        if (invoiceResponseJson.pr) {

            const tags:string[][] = [ ];

            tags.push(['p', event.pubkey]);
            // tags.push(['verify', invoiceResponseJson.verify.lastIndexOf('/')]);

            const invMessage = 'Please pay this amount using a lightning wallet to get response from ' + aiagent.SystemPurposes[getAgentIdByPublicKey(ptag)].title + ' ' + invoiceResponseJson.pr;
            console.log(invMessage);
            const encryptContent = await nip04.encrypt(getPrivateKeyByPublicKey(ptag), event.pubkey, invMessage )

            const event4 = await createEvent(4,tags, encryptContent, (getPrivateKeyByPublicKey(ptag)));

            publishRelays(event4);

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


        const body = JSON.stringify ({
            model: "string",
            llm_router: aiagent.SystemPurposes[getAgentIdByPublicKey(ptag)].llmRouter,
            messages,
            temperature: aiagent.SystemPurposes[getAgentIdByPublicKey(ptag)].temperature,
            app_fingerprint: event.pubkey,
            messageId: event.id,
            conversationId: event.id,
            system_purpose: getAgentIdByPublicKey(ptag),
            "top_p": 0.95,
            "n": 1,
            stream: false,
            max_tokens: aiagent.SystemPurposes[getAgentIdByPublicKey(ptag)].maxToken,
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

    }


    // Subscribing to a pool of relays
    const sub = pool.sub(relays, [{ since: (Math.floor(Date.now() / 1000)), kinds: [4, 9735], '#p':pubKeys}]); //
    // Removing all listeners from the 'event' event
    sub.off('event', async event => {console.log('off: ', event); })



    // Adding a listener to the 'event' event
    sub.on('event', async event => {
        console.log(event);
        let count = 0;
        const ptag:string = event.tags.find(([k]) => k === 'p')?.[1] || '';
        const aiagent: any = await getAgent(getAgentIdByPublicKey(ptag));

        //console.log(aiagent);
        //Send invoice back to the user if the AI agent require payment
        if (aiagent.SystemPurposes[getAgentIdByPublicKey(ptag)].paid && event.kind !== 9735) {

            await sendInvoice(event, aiagent, ptag);
            return;

        }

        if (event.kind === 9735) {
            const etag:string = event.tags.find(([k]) => k === 'e')?.[1] || '';
            // event = await getEvent(etag);
            const sourceEvent = await getEvent(etag);

            event.content = sourceEvent.content;
            event.id = sourceEvent.id;
            event.pubkey = sourceEvent.pubkey;
            event.tags = sourceEvent.tags;

            console.log('sourceEvent: ', sourceEvent);
            count=1;
        }



        const eventConversations = await getEventConversations([event.pubkey, ptag]);       
        eventConversations.sort((a, b) => b.created_at - a.created_at);
        console.log(eventConversations);


        const messages:message[] = [];

        const msg:message = {
            role: 'system',
            content:aiagent.SystemPurposes[getAgentIdByPublicKey(ptag)].systemMessage,
            created_at:0


        }

        messages.push(msg);

        for (const [index, eventConversation] of eventConversations.entries()) {
                if (index === 5) break;

                if (count===0 && index === 1) {
                    const countTag:string = eventConversation.tags.find(([k]) => k === 'count')?.[1] || '';
                    console.log('countTag: ', countTag);
                    if (countTag) count = parseInt(countTag,10) + 1;
                    console.log('Updated count: ', count);

                }

                try {

                    const input:message = {
                        role: eventConversation.pubkey===ptag?'assistant':'user',
                        content: await nip04.decrypt(getPrivateKeyByPublicKey(ptag), (eventConversation.pubkey === ptag)?event.pubkey:eventConversation.pubkey, eventConversation.content),
                        created_at:eventConversation.created_at

                    }

                    if (!input.content.startsWith('Please pay this amount')) messages.push(input);



                } catch (error) {
                    // ignore error and move on
                    console.log(error)
                }

        }
        if (!aiagent.SystemPurposes[getAgentIdByPublicKey(ptag)].paid && count === aiagent.SystemPurposes[getAgentIdByPublicKey(ptag)].convoCount) {
            await sendInvoice(event, aiagent, ptag);
            return;

        }

        messages.sort((a, b) => a.created_at - b.created_at);

        console.log(messages);

        const response = await getllmResponse(event, aiagent, ptag, messages)

        const tags:string[][] = [ ];

        if (count===0)count=1;

        tags.push(['p', event.pubkey]);
        tags.push(['count',  count + '']);


        const encryptContent = await nip04.encrypt(getPrivateKeyByPublicKey(ptag), event.pubkey, response)

        const event4 = await createEvent(4,tags, encryptContent, (getPrivateKeyByPublicKey(ptag)));

        publishRelays(event4);



})






}





