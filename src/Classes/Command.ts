import { CommandInteraction, InteractionResponse, SlashCommandBuilder, type CacheType } from "discord.js";

abstract class Command extends SlashCommandBuilder {
    constructor() {
        super();
    }
    
    abstract execute(interaction: CommandInteraction): Promise<InteractionResponse | void>;
}

export default Command;