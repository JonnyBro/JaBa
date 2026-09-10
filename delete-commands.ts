import { REST, Routes } from "discord.js";
import env from "dotenv";

env.config({
	quiet: true,
});

const clientId = process.env.CLIENT_ID;
const token = process.env.TOKEN;

if (!clientId) throw new Error("clientId is not defined in the config");
if (!token) throw new Error("token is not defined in the config");

const rest = new REST().setToken(token);

rest.put(Routes.applicationCommands(clientId), { body: [] })
	.then(() => console.log("Successfully deleted all application commands"))
	.catch(console.error);
