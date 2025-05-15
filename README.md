# JaBa Bot

![JaBa avatar](https://cdn.discordapp.com/avatars/708637495054565426/e1e9a50ec08988d1b25c13f8bd4801bd.webp?size=128)
JaBa is an open source Discord Bot written by [Jonny_Bro](https://github.com/JonnyBro) using [discord.js](https://github.com/discordjs/discord.js) and [Mongoose](https://mongoosejs.com).

[![image](https://img.shields.io/discord/892727526911258654?logo=discord&&colorB=00BFFF&label=Discord&style=flat-square)](https://discord.gg/Ptkj2n9nzZ)
[![image](https://img.shields.io/badge/discord.js-v14.14.1-blue.svg?logo=npm)](https://github.com/discordjs/discord.js)
[![image](https://img.shields.io/github/license/JonnyBro/JaBa?label=License&style=flat-square)](https://github.com/JonnyBro/JaBa/blob/main/LICENSE)

## Functionality

JaBa offers:

* Slash and Context commands.
* Supports commands in DMs.
* Localization support (any language; English, Russian and Ukrainian for now).
* Basic messages monitoring (updating and deletion).

## Commands

JaBa does many thing, here is **8 main categories**:

* **Administration**: `automod`, `autorole`, `config`, `goodbye`, `selectroles`, `stealemoji` and **3** more!
* **Moderation**: `clear`, `giveaway`, `poll`, `warn` and **4** more!
* **Music**: `play`, `skip`, `queue`, `nowplaying`, `shuffle` and **8** more!
* **Economy**: `profile`, `work`, `achievements`, `slots`, `tictactoe`, `leaderboard` and **9** more!
* **Fun**: `8ball`, `crab`, `lmgtfy`, `lovecalc`, `memes` and **2** more!
* **General**: `afk`, `avatar`, `boosters`, `minecraft`, `remindme`, `shorturl`, `serverinfo`, `userinfo`, `whois` and **7** more!
* **Bot's owner commands**: `eval`, `servers`, `reload` and **2** more!

## Get The Bot

### Ready To Use

You can invite JaBa on your server, message me (@jonny_bro) on Discord, find @JaBa#9042 on the server that uses it or join my [Server](https://discord.gg/NPkySYKMkN).

> [!IMPORTANT]
> I'm not sharing the invite link or YouTube will cry

### Selfhosting

You can host JaBa yourself.\
Use [this instruction](https://github.com/JonnyBro/JaBa/wiki/Self-Hosting) to learn how!

## Docker Setup

You can run JaBa and its dependencies using Docker Compose. This project provides a `Dockerfile` and a `docker-compose.yml` for easy setup.

### Requirements

* Docker and Docker Compose installed
* The bot uses Node.js **v22.14.0** and pnpm **v10.4.1** (handled by the Dockerfile)
* MongoDB is required and provided as a service in the compose file

### Configuration

* Copy `config.sample.json` to `config.json` and edit it with your bot token and other settings before running.
* If you use environment variables, you can add an `.env` file and uncomment the `env_file` line in `docker-compose.yml`.
* No ports are exposed by default, as JaBa is a Discord bot and does not serve HTTP traffic.
* MongoDB data is persisted in the `mongo-data` Docker volume.

### Build and Run

To start JaBa and MongoDB for development:

```sh
docker compose up --build
```

* The `typescript-app` service runs the bot in development mode and mounts your local `src` directory for live code updates.
* The `mongo` service provides a MongoDB instance for the bot.

If you want to run in production mode, you can build the production image by changing the build target in the compose file to `final` and removing the volume mount.

### Notes

* No ports are exposed by default. If you need to access MongoDB from your host, uncomment the `ports` section in the `mongo` service.
* If you require MongoDB authentication, set the `MONGO_INITDB_ROOT_USERNAME` and `MONGO_INITDB_ROOT_PASSWORD` environment variables in the compose file.

## Links

* [Changelog](https://blog.jababot.ru)
* [Full commands list](https://dash.jababot.ru/commands)
* [Discord](https://discord.gg/Ptkj2n9nzZ)
* [Github](https://github.com/JonnyBro/JaBa/)

## Support

If you have any questions you can ask them on my [Discord Server](https://discord.gg/NPkySYKMkN).\
If you want to contribute, feel free to fork this repo and making a pull request!

## TODO

* [ ] Some sort of dashboard.

## License

JaBa uses *GNU GPL v3.0* license. You can find it here [LICENSE](LICENSE).
