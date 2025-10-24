// Interfaces
import type { BotCommands } from "./Interfaces/BotCommands.ts";
// ----
// Dot-Env
import "dotenv/config";
// ----
import {Client, Collection, GatewayIntentBits, IntentsBitField, Partials, type CacheType, type Interaction} from "discord.js";
import CommandHandler from "./Handlers/CommandHandler.ts";
import CommandInteractionHandler from "./Events/CommandInteraction.ts";
// ----
// Lavalink-Connection
import { LavalinkManager, type ManagerOptions, type VoiceState } from "lavalink-client";
import LavalinkEventHandler from "./Events/LavalinkEvents.ts";

// Lavalink-Configuration

const LavalinkConfig: ManagerOptions = {
    nodes: [
        {
            authorization: "1234",
            host: "localhost",
            port: 3055,
            id: "AdoRel-Node",
            // Resuming Session
            sessionId: "124",
            heartBeatInterval: 15_000,
            enablePingOnStatsCheck: true,
            retryDelay: 10e3,
            secure: false,
            retryAmount: 5,
            closeOnError: false
        }
    ],
    // Player Options
    playerOptions: {
        onDisconnect: {
            autoReconnect: true,
            destroyPlayer: false
        },
        defaultSearchPlatform: "spotify.com"
    },
    // Send Voice Server Updates to LavaLink-Client.
    sendToShard: (guildId: string, payload) => {
        const guild = client.guilds.cache.get(guildId);
        if (guild) guild.shard.send(payload);
    },

    autoSkip: true,
    client: {
        id: process.env.CLIENT_ID as string,
        username: "AdoRel"
    }
}

// ---- Discord's Client Configuration
const intents: GatewayIntentBits[] = [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.GuildVoiceStates,
    IntentsBitField.Flags.MessageContent
]

const partials: Partials[] = [
    Partials.GuildMember,
    Partials.Message,
    Partials.Channel,
    Partials.User
]
// ----


class Ado extends Client {
    public commands: Collection<string, BotCommands> = new Collection();
    public lavalink: LavalinkManager = new LavalinkManager(LavalinkConfig);


    constructor() {
        super({
            intents: intents,
            partials: partials,
            allowedMentions: {repliedUser: true},
            presence: {
                status: "online",
                activities: [{
                    name: "Development",
                    type: 0,
                    state: "Hello World!",
                }]
            }
        });
        
        // Send raw data to Lavalink-Client.
        this.on("raw", (d) => this.lavalink.sendRawData(d));

        this.on("clientReady", async (client: Client<true>) => {
            console.log("Conectado como: "+ client.user.tag);
            // Handle Modular Commands.
            new CommandHandler();
            // Start Lavalink-Server
            this.lavalink.init({...client.user});
            new LavalinkEventHandler(this.lavalink);

            setInterval(async () => {
                for (const node of this.lavalink.nodeManager.nodes.values()) {
                    try{
                        console.log("Pinging nodes...", "Stats: "+ await node.fetchStats())
                    }catch(error: unknown) {
                        console.error("Failed to ping node: "+node.id+"\nTrying to reconnect..");
                        node.connect();
                    }
                }
            }, 30*1000);

        });



        // Handle Command-Interaction.
        this.on("interactionCreate", async (interaction: Interaction<CacheType>) => {
            if(!interaction.guild) return;
            if(!interaction.isCommand()) return;

            CommandInteractionHandler.handle(interaction);
        });

        // Bot's Login.
        this.login(process.env.TOKEN);
    }
}

export const client = new Ado();