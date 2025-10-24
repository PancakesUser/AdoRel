import type { CacheType, ChatInputCommandInteraction, CommandInteraction, Guild, GuildMember, InteractionResponse, VoiceBasedChannel } from "discord.js";
import Command from "../../Classes/Command.ts";
import { client } from "../../index.ts";
import type { Track } from "lavalink-client";

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
        
            await player.connect();

            const {tracks} = await player.search(query, member.user, true);


            if(tracks.length === 0) return interaction.reply({content: "No results have been found for your request! :C"});

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