import { type InvalidLavalinkRestRequest, type LavalinkManager, type LavalinkPlayer, type Track, type WebSocketClosedEvent, LavalinkNode, Player } from "lavalink-client";
import { client } from "../index.ts";

export default class LavalinkEventHandler {
    constructor(lavalinkManager: LavalinkManager) {
        // Handle Player Events as Resume, Pause, Skip ...
        
        // Handle Track-Reproduction.

        lavalinkManager.nodeManager.on("connect", (node: LavalinkNode) => node.updateSession(true, 360e3));

        lavalinkManager.nodeManager.on("resumed", async (node: LavalinkNode, payload, fetchedPlayers: LavalinkPlayer[] | InvalidLavalinkRestRequest): Promise<void> => {

        });


        lavalinkManager.on("trackStart", async (player: Player, track: Track | null): Promise<void> => {

        });


        lavalinkManager.on("playerSocketClosed", (player: Player, payload: WebSocketClosedEvent) => {
            console.log("A player has been disconnected, try to reconnect to the voice channel.");
            player.node.connect(player.node.sessionId as string);
            console.log(payload.code, payload.guildId, payload.reason)
        });


        lavalinkManager.nodeManager.on("error", (node: LavalinkNode, error: Error, payload: unknown) => {
            console.log("Lavalink tuvo un error:" , error, payload);
        });

        lavalinkManager.nodeManager.on("disconnect", async (node, reason) => {
            console.log("Client has been disconnected: "+"code: "+reason.code+"reason: "+reason.reason);
            console.log("Sesión ID:", node.sessionId);
        });

        //Handle Queue-End.
        lavalinkManager.on("queueEnd", async (player: Player): Promise<void> => {
            // Player Queue's empty. Start a timeout in order to leave the voice-channel.
            setTimeout(async () => {
                try{

                    if(player.playing) return;

                    const guild = client.guilds.cache.get(player.guildId);
                    if(!guild) return;
                    // Destroy music player and leave the current voice-channel to save resources.
                    await player.destroy();
                    // Check if there's an available voice channel to send the disconnection-message.
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
        }) 

        // lavalinkManager.on("playerQueueEmptyEnd", function(player: Player): void {
        //     // Player Queue's empty. Start a timeout in order to leave the voice-channel.
        //     console.log("Queue's empty");

        //     setTimeout(() => {
        //         try{
        //             const guild = client.guilds.cache.get(player.guildId);
        //             if(!guild) return;
        //             const channel = guild.channels.cache.get(player.textChannelId as string);
        //             if(!channel) return;

        //             if(channel && channel.isSendable()) {
        //                 channel.sendTyping();
        //                 channel.send("I've left the voice-channel due to the inactivity! :P!");
        //                 return;
        //             }
        //         }catch(error: unknown) {
        //             console.error("Something went wrong while trying to destroy a music player: ", error);
        //         }
        //     }, 3*1000*60);
        // });
    }
}
