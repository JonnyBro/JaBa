import { REST, Routes } from "discord.js";
import { token } from "./config.json";

const clientId = "bots_client_id"; // You'r bot's client id
const rest = new REST().setToken(token);

// Delete all commands
rest.put(Routes.applicationCommands(clientId), { body: [] })
	.then(() => console.log("Successfully deleted all application commands."))
	.catch(console.error);
