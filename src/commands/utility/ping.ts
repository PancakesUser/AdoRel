import { CommandInteraction, type CacheType } from "discord.js";
import Command from "../../Classes/Command.ts";

class Ping extends Command {
    constructor() {
        super();
        this.setName("ping");
        this.setDescription("Replies with Ping!");
        this.setDefaultMemberPermissions(0);
    }

    async execute (interaction: CommandInteraction) {
        interaction.reply({content: "Pong"})
    }
}

export default Ping;