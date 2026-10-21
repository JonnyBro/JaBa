import useClient from "@/utils/use-client.js";

const client = useClient();

export const data = {
	name: "raw",
	once: false,
};

export async function run(d: Parameters<typeof client.lavalink.sendRawData>[0]) {
	client.lavalink.sendRawData(d);
}
