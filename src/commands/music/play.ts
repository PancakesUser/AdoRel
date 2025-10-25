import {  ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, type ChatInputCommandInteraction,  type Guild, type GuildMember, type Interaction, type InteractionResponse, type JSONEncodable, type VoiceBasedChannel } from "discord.js";
import { client } from "../../index.ts";
import prettyMS from "pretty-ms";
// Lavalink
import type { Track, UnresolvedTrack } from "lavalink-client";
// ----
// Classes
import Command from "../../Classes/Command.ts";
// ----



// Embed - Functions
function returnSelectedTrack(track: Track | UnresolvedTrack, member: GuildMember): EmbedBuilder {
    const SelectedTrack: EmbedBuilder = new EmbedBuilder();

    // Get Basic Track-Information such as title, author, artworkUrl...
    const {title, author, artworkUrl, duration} = track.info;
    const {artistArtworkUrl} = track.pluginInfo;
    
    if(artistArtworkUrl) {
        SelectedTrack.setThumbnail(artistArtworkUrl);
    }

    if(artworkUrl) {
        SelectedTrack.setImage(artworkUrl);
    }

    SelectedTrack.setTitle("Added to queue");
    SelectedTrack.setDescription(`**${title}** \`\`\`yaml\nAuthor: ${author}\`\`\`\`\`\`yaml\nDuration: ${duration ? `${prettyMS(duration, {keepDecimalsOnWholeSeconds: false, secondsDecimalDigits: 0})}\`\`\`` : ""}\nRequester: <@${member.user.id}>`);
    SelectedTrack.setFooter({text: "Enjoy! :P"})
    SelectedTrack.setColor("Green")

    return SelectedTrack;
}
// ----

class Play extends Command {
    constructor() {
        super();
        this.setName("play")
        this.setDescription("Request a song and be ready to enjoy! :D")
        this.addStringOption(option => 
            option
            .setName("query")
            .setDescription("Put url or song's name! :P")
            .setMinLength(3)
            .setRequired(true)
        )
        this.setDefaultMemberPermissions(0)
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<InteractionResponse<true>  | void> {
        if(!interaction.isCommand()) return;
        
        const query: string | null = interaction.options.getString("query");
        if(!query) return;

        // Discord-Guild
        const guild = interaction.guild as Guild;
        // Discord-Guild-Member
        const member: GuildMember = interaction.member as GuildMember;
        // Voice-Channel
        const voice: VoiceBasedChannel = member.voice.channel as VoiceBasedChannel;


        if(!voice) return interaction.reply({content: "Join a voice channel :P 🔊"});
        // Lavalink-Player
        const player = client.lavalink.getPlayer(guild.id) || client.lavalink.createPlayer({
            guildId: guild.id,
            voiceChannelId: voice.id,
            textChannelId: interaction.channelId,
            vcRegion: "auto",
            volume: 100
        });


        try{

            if(!player.connected) {
                player.connect();
            }else{
                console.log("Is player-node Alive: ", player.node.isAlive);
            }

            const {tracks} = await player.search(query, member.user, true);
            
            if(tracks.length === 0) return interaction.reply({content: "No results have been found for your request! :C"});


            const listedTracks: Track[] = tracks as Track[];
            let slicedTracks: Track[] = listedTracks.slice(0, 5);

            // TrackSelectMenu-Embed ---
            const TrackSelectMenu: EmbedBuilder = new EmbedBuilder();

            // TrackSelectMenu-Artist-Portrait
            if(slicedTracks && slicedTracks.length >= 0) {
                const artistArtWork = slicedTracks[0]?.pluginInfo.artistArtworkUrl;
                if(artistArtWork != null || artistArtWork != undefined) {
                    TrackSelectMenu.setThumbnail(artistArtWork);
                }
            }
        
            TrackSelectMenu.setTitle("-- TRACK SELECTION --")
            TrackSelectMenu.setDescription(`Select the number of the song that you'd like to listen\nIf nothing is selected in **60s** a random song will be selected.\n${slicedTracks.map((track: Track, i: number) => {
                return `${i+1}\`\`\`yaml\nTitle: ${track.info.title}\nAuthor: ${track.info.author}\n
                \`\`\``
            }).join(" ").trim()}`);
            TrackSelectMenu.setColor("Green")
            TrackSelectMenu.setFooter({text: "Requested by: "+member.user.displayName})
            // ----

            // TrackSelectMenu-Action-Row ---
            const NumbersActionRow = new ActionRowBuilder<ButtonBuilder>();
            const NumbersActionRow_2 = new ActionRowBuilder<ButtonBuilder>();
            const PagesActionRow = new ActionRowBuilder<ButtonBuilder>();


            // Generate a button for every entry from ListedTracks from the LavaLink-Search.
            const ButtonsForQueue: ButtonBuilder[] = [];

            for (var i = 0; i < listedTracks.length; i++) {
                const x_button: ButtonBuilder = new ButtonBuilder()
                .setCustomId(`${i}`)
                .setLabel(`${i+1}`)
                .setStyle(ButtonStyle.Primary)

                ButtonsForQueue.push(x_button);
            }

            // Handle Page-Management
            // const pages: number = Math.ceil(listedTracks.length / 5);
            let start: number = 0;
            let end: number = 5;

            console.log(start, end);

            let pageItems = listedTracks.slice(start, end);


            // 
            const next_page: ButtonBuilder = new ButtonBuilder()
            .setCustomId("next_page")
            .setLabel("➡️")
            .setStyle(ButtonStyle.Secondary)

            const previous_page: ButtonBuilder = new ButtonBuilder()
            .setCustomId("previous_page")
            .setLabel("⬅️")
            .setStyle(ButtonStyle.Secondary)
            
            NumbersActionRow.addComponents(ButtonsForQueue.slice(0, 5));
            NumbersActionRow_2.addComponents(ButtonsForQueue.slice(5,10));
            PagesActionRow.addComponents([previous_page, next_page]);
    
            // ----

            const message = await interaction.reply({embeds: [TrackSelectMenu], components: [NumbersActionRow, PagesActionRow]})
            

            const collector = message.createMessageComponentCollector({time: 2*60*1000});

            collector.on("collect", async (collected): Promise<void> => {
                // Defer the Embed Edit.
                await collected.deferUpdate();
                // Verify if the user that has era
                if(collected.user.id !== member.user.id) return;

                if(collected.customId === "next_page") {
                    
                    start = Math.min(start + 5, 10);
                    end = Math.min(start + 5, 10);
                    console.log(start);

                    pageItems = listedTracks.slice(start, end);

                    // The end of the page has been reached.
                    if(pageItems.length === 0) {
                        return;
                    }

                    const TrackSelectMenuNextPage: EmbedBuilder = EmbedBuilder.from(TrackSelectMenu.toJSON())
                    .setDescription(`Select the number of the song that you'd like to listen\n\nIf nothing is selected in **60s** a random song will be selected.\n${pageItems.map((track: Track, i: number) => {
                        return `${i+start+1}.\`\`\`yaml\nTitle: ${track.info.title}\nAuthor: ${track.info.author}\n
                        \`\`\``
                    }).join(" ").trim()}`);

                    collected.editReply({embeds: [TrackSelectMenuNextPage], components: [NumbersActionRow_2, PagesActionRow]});
                    return;
                }else if(collected.customId === "previous_page") {
                    start = Math.max(start - 5, 0);
                    end = start + 5;
                    console.log("start", start, "end", end);

                    pageItems = listedTracks.slice(start, end);
                    
                    const TrackSelectMenuNextPage: EmbedBuilder = EmbedBuilder.from(TrackSelectMenu.toJSON())
                    .setDescription(`Select the number of the song that you'd like to listen\n\nIf nothing is selected in **60s** a random song will be selected.\n${pageItems.map((track: Track, i: number) => {
                        return `${i+start+1}.\`\`\`yaml\nTitle: ${track.info.title}\nAuthor: ${track.info.author}\n
                        \`\`\``
                    }).join(" ").trim()}`);

                    collected.editReply({embeds: [TrackSelectMenuNextPage], components: [NumbersActionRow_2, PagesActionRow]});
                    return;
                }

               const selectedTrack: Track | undefined = listedTracks[(parseInt(collected.customId))];
               
                console.log("Track selected by button: ", selectedTrack?.info.title+" Button Touched: "+collected.customId)

               if(!selectedTrack) return;
                // Edit the Track-Select-Menu Embed with the Selected-Track-Embed.
               collected.editReply({embeds: [returnSelectedTrack(selectedTrack, member)], components: []})

               await player.play({
                track: selectedTrack
               });
            });

            collector.on("end", (collected): void => {
                console.log("Track-Select-Menu Collection has ended.");
            });
        }catch(error: unknown) {
            console.error("Something went wrong trying to reproduce a song: ", error);
        }
    }
}

export default Play;