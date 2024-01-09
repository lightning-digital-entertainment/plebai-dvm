import { getPublicKey } from "nostr-tools";
import { SystemPurposeData, createEvent, getAgentKey, getAgents, publishRelays } from "./helpers"



export async function updateNIP05() {

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
        // console.log(aiagent.id, key );
    }

    const getPrivateKeyByPublicKey = (publicKey: string): string | null => {
        const filteredKeys = privateKeys.filter(([pubKey, _]) => pubKey === publicKey);
        if (filteredKeys.length > 0) return filteredKeys[0][1];
        return null; // Return null if no matching public key is found
    };

    aiAgents.filter(async aiagent => {

            if (aiagent.id === 'GenImage') {

                const content = {
                    "lud06":"",
                    "lud16": aiagent.nip05,
                    "website": "https://chat.plebai.com",
                    "nip05": aiagent.nip05,
                    "picture": aiagent.symbol,
                    "display_name": 'Gen Image PlebAI',
                    "about": 'Plebs version of stabilityAI and chatGPT. By harnessing the most suitable models and Lora, we bring to life the exact visual representations of your prompts. Explore a domain of over 100 AI agents, each ready to cater to your unique prompts at https://chat.plebai.com. Connect and collaborate on our Discord server at https://discord.gg/DfSZpqUKYG to receive zap splits for the AI agents you craft. With PlebAI, transform your ideas into reality.',
                    "name": 'Gen Image PlebAI'
                };

                const tags2:string[][] = [];
                tags2.push(['info', 'https://plebai.com/agent/' + aiagent.id]);


                const event0 = await createEvent(0,tags2, JSON.stringify(content), (getPrivateKeyByPublicKey('04f74530a6ede6b24731b976b8e78fb449ea61f40ff10e3d869a3030c4edc91f')));

                // console.log(event0);
                publishRelays(event0);

            }




    })








}