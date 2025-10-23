import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
// Ado Client
import { client } from "../index.ts";
import { REST, Routes, SlashCommandBuilder } from "discord.js";


async function readCommands(): Promise<void> {
    const commandFiles = fs.readdirSync(path.resolve(path.join(import.meta.dirname, "../commands")), {withFileTypes: true});

    async function handleSubFolderCommands(folder: string): Promise<void> {
        const folderContent = fs.readdirSync(path.resolve(path.join(import.meta.dirname, "../commands", folder))).filter((file) => file.endsWith(".ts"));

        for (const file of folderContent) {
            const convertedPathURL = pathToFileURL(path.resolve(import.meta.dirname, "../commands", folder, file)).href;

            const command = await import(convertedPathURL);
            const commandInstance = new command.default()
           
            // Register Commands in Discord's Collection.
            client.commands.set(commandInstance.name, {data: commandInstance, execute: commandInstance.execute});
        }
    }


    async function handleRootCommands(file: fs.Dirent): Promise<void> {
        const commandPath = path.resolve(import.meta.dirname, "../commands", file.name);
        const convertedCommandPath = pathToFileURL(commandPath).href;
        const command = await import(convertedCommandPath);
        const commandInstance = new command.default();

        // Register Commands in Discord's Collection.
        client.commands.set(commandInstance.name, {data: commandInstance, execute: commandInstance.execute});
    }


    for (const file of commandFiles) {
        // Handle Sub-Folder commands.
        if(file.isDirectory()) {
            await handleSubFolderCommands(file.name)
        }else{
            // Handle Root Commands.
            await handleRootCommands(file);
        }
    }
}

// Upload Slash-Commands based on Discord's Command Collection.
async function uploadSlashCommands(): Promise<void> {
    const commands: SlashCommandBuilder[] = [];

    client.commands.map((command) => {
        commands.push(command.data);
    });

    const rest = new REST({version: "10"}).setToken(process.env.TOKEN as string);
    
    try{
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID as string), {body: commands});
        console.log("Commands've been uploaded to Discord's API ✅")
    }catch(error: unknown) {
        console.error("Something went wrong uploading command to Discord's API: ", error);
    }

}

class CommandHandler {
    constructor() {
        this.init()
    }

    async init() {
        await readCommands();
        await uploadSlashCommands();
    }
}


export default CommandHandler;