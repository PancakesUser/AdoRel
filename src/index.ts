// Dot-Env
import "dotenv/config";
// Dot-Env
import {Client, Collection, CommandInteraction, GatewayIntentBits, IntentsBitField, Partials, SlashCommandBuilder, type CacheType, type Interaction} from "discord.js";
import CommandHandler from "./handlers/CommandHandler.ts";
import CommandInteractionHandler from "./Events/CommandInteraction.ts";


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

class Ado extends Client {
    public commands: Collection<string, {data: SlashCommandBuilder, execute: Function}> = new Collection();

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


        this.on("clientReady", async (client: Client<true>) => {
            console.log("Conectado como: "+ client.user.tag);
            // Handle Modular Commands.
            new CommandHandler();
        });

        // Handle Command-Interaction.
        this.on("interactionCreate", async (interaction: Interaction<CacheType>) => {
            if(!interaction.guild) return;
            if(!interaction.isCommand()) return;
            CommandInteractionHandler.handle(interaction);
        });

        this.login(process.env.TOKEN);
    }
}

export const client = new Ado();