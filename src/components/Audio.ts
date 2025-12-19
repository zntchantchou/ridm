class Audio {
  ctx: AudioContext | null = null; // initiate at null?
  bd?: null | AudioBuffer = null;

  public async init(audioContext: AudioContext) {
    if (!audioContext)
      throw Error("Must initialize audioContext with shared audiocontext ");
    this.ctx = audioContext;
    // Create dictionary for default samples to be loaded easily by drumKitPart + path
    this.bd = await this.loadSample(
      "../../samples/AKAIMPC60/akaimpc60-hh/hh.wav"
    );
  }

  private async loadSample(path: string) {
    const fetched = await fetch(path);
    const ab = await fetched.arrayBuffer();
    return this.ctx?.decodeAudioData(ab);
  }

  public playSample(buffer: AudioBuffer, time: number = 0) {
    if (!this.ctx)
      throw Error("Must initialize audioContext with share audiocontext ");
    const src = new AudioBufferSourceNode(this.ctx, {
      buffer,
      playbackRate: 1,
    });
    src.connect(this.ctx?.destination);
    src.start(time);
  }

  public playMetronome(beatNumber: number, time: number, steps: number = 0) {
    // console.log("PLAY METRONOME ", beatNumber);
    if (!this.ctx)
      throw Error("Must initialize audioContext with share audiocontext ");
    const osc = this.ctx?.createOscillator();
    osc.connect(this.ctx?.destination);

    // osc.frequency.value = 880.0;
    // beat 0 == high pitch
    // if (beatNumber % 16 === 0) osc.frequency.value = 880.0;
    // quarter notes = medium pitch
    // if (beatNumber % 32 === 0) osc.frequency.value = 220.0;
    osc.frequency.value = 200 + 20 * steps;

    // else if (beatNumber % 4 === 0) osc.frequency.value = 440.0;
    // other 16th notes = low pitch
    // else osc.frequency.value = 220.0;
    osc.start(time);
    osc.stop(time + 0.05);
  }

  public playDefault(time = 0) {
    console.log("[AUDIO] playing sample");
    if (this.bd) this.playSample(this.bd, time);
  }
}

export default new Audio();
