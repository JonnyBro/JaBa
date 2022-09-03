const { AudioPlayer,
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  entersState,
  StreamType,
  VoiceConnection,
  VoiceConnectionStatus,
  VoiceConnectionDisconnectReason } = require("@discordjs/voice");

const TypedEmitter = require("tiny-typed-emitter");
const { Utilities } = require("../Util/Utilities.js")

class StreamDispatcher extends TypedEmitter {
  voiceConnection = null;
  audioPlayer = null;
  channel = null;
  audioResource = null;
  readyLock = false;
  paused = null;

  constructor(voiceConnection, channel, connectionTimeout = 20000) {
    super();

    this.voiceConnection = voiceConnection;
    this.audioPlayer = createAudioPlayer();
    this.channel = channel;
    this.paused = false;

    this.voiceConnection.on("stateChange", async (_, newState) => {
      if (newState.status === VoiceConnectionStatus.Disconnected) {
        if (
          newState.reason === VoiceConnectionDisconnectReason.WebSocketClose &&
          newState.closeCode === 4014
        ) {
          try {
            await entersState(
              this.voiceConnection,
              VoiceConnectionStatus.Connecting,
              connectionTimeout
            );
          } catch {
            this.voiceConnection.destroy();
          }
        } else if (this.voiceConnection.rejoinAttempts < 5) {
          await Utilities.wait(
            (this.voiceConnection.rejoinAttempts + 1) * 5000
          );
          this.voiceConnection.rejoin();
        } else {
          this.voiceConnection.destroy();
        }
      } else if (newState.status === VoiceConnectionStatus.Destroyed) {
        this.end();
      } else if (
        !this.readyLock &&
        (newState.status === VoiceConnectionStatus.Connecting ||
          newState.status === VoiceConnectionStatus.Signalling)
      ) {
        this.readyLock = true;
        try {
          await entersState(
            this.voiceConnection,
            VoiceConnectionStatus.Ready,
            connectionTimeout
          );
        } catch {
          if (
            this.voiceConnection.state.status !==
            VoiceConnectionStatus.Destroyed
          )
            this.voiceConnection.destroy();
        } finally {
          this.readyLock = false;
        }
      }
    });

    this.audioPlayer.on("stateChange", (oldState, newState) => {
      if (newState.status === AudioPlayerStatus.Playing) {
        if (!this.paused) return void this.emit("start", this.audioResource);
      } else if (
        newState.status === AudioPlayerStatus.Idle &&
        oldState.status !== AudioPlayerStatus.Idle
      ) {
        if (!this.paused) {
          void this.emit("finish", this.audioResource);
          this.audioResource = null;
        }
      }
    });

    this.audioPlayer.on("debug", (m) => void this.emit("debug", m));
    this.audioPlayer.on("error", (error) => void this.emit("error", error));
    this.voiceConnection.subscribe(this.audioPlayer);
  }

  createStream(src, ops = { type?: "", data?: "" }) {
    this.audioResource = createAudioResource(src, {
      inputType: ops?.type ?? StreamType.Arbitrary,
      metadata: ops?.data,
      inlineVolume: true,
    });
    return this.audioResource;
  }

  status() {
    return this.audioPlayer.state.status;
  }

  disconnect() {
    try {
      this.audioPlayer.stop(true);
      this.voiceConnection.destroy();
    } catch { }
  }

  end() {
    this.audioPlayer.stop();
  }

  pause(interpolateSilence) {
    const success = this.audioPlayer.pause(interpolateSilence);
    this.paused = success;
    return success;
  }

  resume() {
    const success = this.audioPlayer.unpause();
    this.paused = !success;
    return success;
  }

  async playStream(resource = this.audioResource) {
    if (!resource) throw new PlayerError("Audio resource is not available!", ErrorStatusCode.NO_AUDIO_RESOURCE);
    if (resource.ended) return void this.emit("error", new PlayerError("Cannot play a resource that has already ended."));
    if (!this.audioResource) this.audioResource = resource;
    if (this.voiceConnection.state.status !== VoiceConnectionStatus.Ready) {
      try {
        await entersState(this.voiceConnection, VoiceConnectionStatus.Ready, this.connectionTimeout);
      } catch (err) {
        return void this.emit("error", err);
      }
    }

    try {
      this.audioPlayer.play(resource);
    } catch (e) {
      this.emit("error", e);
    }

    return this;
  }
}

module.exports = { StreamDispatcher }