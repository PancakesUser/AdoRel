import type { CommandInteraction, InteractionResponse } from "discord.js";
import { client } from "../index.ts";

class CommandInteractionHandler {
    static async handle(interaction: CommandInteraction): Promise<InteractionResponse<true> | void> {
        // Get the command from the Discord's Collection.
        const command = client.commands.get(interaction.commandName);

        if(!command) {
            console.error("An unknown command has been triggered: ", interaction.commandName);
            return;
        }

        try{
            await command.execute(interaction);
        }catch(error: unknown) {
            console.error("Something went wrong while executing a command: "+interaction.commandName, error);
        }
    }
}

export default CommandInteractionHandler;