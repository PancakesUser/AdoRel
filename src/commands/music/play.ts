import { ActionRow, ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, Collector, Embed, EmbedBuilder, InteractionCollector, Message, MessageCollector, type ChatInputCommandInteraction,  type Guild, type GuildMember, type Interaction, type InteractionResponse, type VoiceBasedChannel } from "discord.js";
import { client } from "../../index.ts";
import type { Track, UnresolvedTrack } from "lavalink-client";
// Discord.JS Voice
import { joinVoiceChannel } from "@discordjs/voice";
// Classes
import Command from "../../Classes/Command.ts";
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
            const slicedTracks: Track[] = listedTracks.slice(0, 5);

            // TrackSelectMenu-Embed ---
            const TrackSelectMenu: EmbedBuilder = new EmbedBuilder();
            TrackSelectMenu.setTitle("-- TRACK SELECTION --")
            TrackSelectMenu.setDescription(`${slicedTracks.map((track: Track, i: number) => {
                return `\`\`\`yaml\n${i + 1} ${track.info.title}\nAuthor: ${track.info.author}\n
                \`\`\``
            }).join(" ").trim()}`);
            TrackSelectMenu.setColor("Green")
            TrackSelectMenu.setFooter({text: "Requested by: "+member.user.displayName})
            // ----

            // TrackSelectMenu-Action-Row ---
            const NumbersActionRow = new ActionRowBuilder<ButtonBuilder>();
            const PagesActionRow = new ActionRowBuilder<ButtonBuilder>();

            const one_number_button: ButtonBuilder = new ButtonBuilder()
            .setId(1)
            .setCustomId("one")
            .setLabel("1")
            .setStyle(ButtonStyle.Primary)

            const two_number_button: ButtonBuilder = new ButtonBuilder()
            .setId(2)
            .setCustomId("two")
            .setLabel("2")
            .setStyle(ButtonStyle.Primary)

            const three_number_button: ButtonBuilder = new ButtonBuilder()
            .setId(3)
            .setCustomId("three")
            .setLabel("3")
            .setStyle(ButtonStyle.Primary)

            const four_number_button: ButtonBuilder = new ButtonBuilder()
            .setId(4)
            .setCustomId("four")
            .setLabel("4")
            .setStyle(ButtonStyle.Primary)

            const five_number_button: ButtonBuilder = new ButtonBuilder()
            .setId(5)
            .setCustomId("five")
            .setLabel("5")
            .setStyle(ButtonStyle.Primary)
            
            const next_page: ButtonBuilder = new ButtonBuilder()
            .setCustomId("next_page")
            .setLabel("➡️")
            .setStyle(ButtonStyle.Secondary)
            
            NumbersActionRow.addComponents([one_number_button, two_number_button, three_number_button, four_number_button, five_number_button]);
            PagesActionRow.addComponents([next_page]);

            // ----

            const message = await interaction.reply({embeds: [TrackSelectMenu], components: [NumbersActionRow, PagesActionRow]})
            

            const collector = message.createMessageComponentCollector({time: 1*60*60*1000});
            
            collector.on("collect", async (collected) => {
                await collected.deferUpdate();
                message.edit({content: "hi :3"})
            });

 

            await player.play({
                track: tracks[0] as Track,
                volume: 100
            });

        }catch(error: unknown) {
            console.error("Something went wrong trying to reproduce a song: ", error);
        }
    }
}

export default Play;