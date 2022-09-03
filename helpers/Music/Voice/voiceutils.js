class VoiceUtils {
  /**
   *
   * @param {VoiceChannel} channels
   * @param {Options} options
   * @returns
   */

  async connect(channel, options = {}) {
    const conn = await this.join(channel, options);
    const sub = new StreamDispatcher(conn, channel, options.maxTime);
    return sub;
  }

  /**
   *
   * @param {VoiceChannel} channel
   * @returns
   */

  async join(channel) {
    let conn = joinVoiceChannel({
      guildId: channel.guild.id,
      channelId: channel.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
      selfDeaf: Boolean(options.deaf),
    });

    try {
      conn = await entersState(
        conn,
        VoiceConnectionStatus.Ready,
        options?.maxTime ?? 20000
      );
      return conn;
    } catch (err) {
      conn.destroy();
      throw err;
    }
  }

  /**
   *
   * @param {VoiceConnection} connection
   * @returns
   */

  disconnect(connection) {
    if (connection) return connection.voiceConnection.destroy();
    return connection.destroy();
  }
}

module.exports = { VoiceUtils };
