import { REST, Routes } from "discord.js";
import { clientId, token } from "./config.json";

if (!clientId) throw new Error("clientId is not defined in the config");
if (!token) throw new Error("token is not defined in the config");

const rest = new REST().setToken(token);

// Delete all commands
rest.put(Routes.applicationCommands(clientId), { body: [] })
	.then(() => console.log("Successfully deleted all application commands"))
	.catch(console.error);
