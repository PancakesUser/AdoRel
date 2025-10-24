import { type LavalinkManager, type Track, Player } from "lavalink-client";
import { client } from "../index.ts";

export default class LavalinkEventHandler {
    constructor(lavalinkManager: LavalinkManager) {
        // Handle Player Events as Resume, Pause, Skip ...
        
        // Handle Track-Reproduction.
        lavalinkManager.on("trackStart", async (player: Player, track: Track | null): Promise<void> => {

        });

        lavalinkManager.on("playerQueueEmptyEnd", function(player: Player): void {
            // Player Queue's empty. Start a timeout in order to leave the voice-channel.
            setTimeout(() => {
                try{
                    const guild = client.guilds.cache.get(player.guildId);
                    if(!guild) return;
                    const channel = guild.channels.cache.get(player.textChannelId as string);
                    if(!channel) return;

                    if(channel && channel.isSendable()) {
                        channel.sendTyping();
                        channel.send("I've left the voice-channel due to the inactivity! :P!");
                        return;
                    }
                }catch(error: unknown) {
                    console.error("Something went wrong while trying to destroy a music player: ", error);
                }
            }, 3*1000*60);
        });
    }
}
