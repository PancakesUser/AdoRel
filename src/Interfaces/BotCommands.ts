import type { SlashCommandBuilder } from "discord.js";

export interface BotCommands {
    data: SlashCommandBuilder,
    execute: Function
}