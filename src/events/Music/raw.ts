import useClient from "@/utils/use-client.js";

const client = useClient();

export const data = {
	name: "raw",
	player: false,
	once: false,
};

export async function run(d: any) {
	client.lavalink.sendRawData(d);
}
