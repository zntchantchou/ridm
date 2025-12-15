class Audio {
  ctx: AudioContext = new AudioContext();
  bd?: null | AudioBuffer = null;

  public async init() {
    this.bd = await this.loadSample(
      "../../samples/AKAIMPC60/akaimpc60-hh/hh.wav"
    );
  }

  private async loadSample(path: string) {
    const fetched = await fetch(path);
    const ab = await fetched.arrayBuffer();
    return this.ctx.decodeAudioData(ab);
  }

  public playSample(buffer: AudioBuffer, time: number = 0) {
    const src = new AudioBufferSourceNode(this.ctx, {
      buffer,
      playbackRate: 1,
    });
    src.connect(this.ctx.destination);
    src.start(time);
  }

  public playDefault(time = 0) {
    console.log("[AUDIO] playing sample");
    if (this.bd) this.playSample(this.bd, time);
  }
}

export default new Audio();
