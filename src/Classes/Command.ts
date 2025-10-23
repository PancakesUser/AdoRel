import { CommandInteraction, SlashCommandBuilder, type CacheType } from "discord.js";

abstract class Command extends SlashCommandBuilder {
    constructor() {
        super();
    }
    
    abstract execute(interaction: CommandInteraction): Promise<void>;
}

export default Command;