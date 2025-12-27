import Controls from "./Controls";
import type { SoundSettings } from "./Stepper";

const samplesDirPath = "../../samples/defaults/";

class Audio {
  ctx: AudioContext | null = null; // initiate at null?
  mainVolume: GainNode | null = null;
  defaultSamples: DefaultSampleType[] = [];

  public async init(audioContext: AudioContext) {
    if (!audioContext)
      throw Error("Must initialize audioContext with shared audiocontext ");
    this.ctx = audioContext;
    await this.preLoadDefaultSamples();
    this.mainVolume = new GainNode(this.ctx);
  }

  private async preLoadDefaultSamples() {
    const samples = [];
    for (const { name, path } of SAMPLES_DIRS) {
      samples.push({ name, path, src: await this.loadSample(path) });
    }
    this.defaultSamples = samples;
  }

  private async loadSample(path: string) {
    if (!this.ctx)
      throw Error("Must initialize audioContext with share audiocontext ");
    const fullPath = `${samplesDirPath}/${path}`;
    const fetched = await fetch(fullPath);
    const ab = await fetched.arrayBuffer();
    return this.ctx.decodeAudioData(ab);
  }

  // get the an array of AudioNode[] from the stepper that plays the sound.
  // First connect the stepper's nodes
  // then connect the global AudioNodes (mainVolume, destination...)
  public playSample(
    buffer: AudioBuffer,
    time: number = 0,
    settings: SoundSettings[]
  ) {
    if (!this.ctx || !Controls.isPlaying)
      throw Error("Must initialize audioContext with share audiocontext ");
    const src = new AudioBufferSourceNode(this.ctx, {
      buffer,
      playbackRate: 1,
    });
    const globalNodes: AudioNode[] = [
      this.mainVolume as GainNode,
      this.ctx?.destination, // destination node must be the last node in the graph
    ];
    const trackNodes = settings.map((s) => s.node);
    const allNodes = [...trackNodes, ...globalNodes];
    this.connectGraphToSource(src, allNodes);
    src.start(time, 0, buffer.duration);
  }

  private connectGraphToSource(src: AudioBufferSourceNode, nodes: AudioNode[]) {
    let prevNode;
    for (const [index, node] of nodes.entries()) {
      if (!index || !prevNode) {
        prevNode = src.connect(node) as AudioNode;
        continue;
      }
      prevNode = prevNode?.connect(node);
    }
  }

  async playDefaultSample(
    name: string,
    time: number,
    settings: SoundSettings[]
  ) {
    const samplePath = SAMPLES_DIRS.find((s) => s.name === name);

    if (samplePath) {
      const sampleItem = this.defaultSamples.find((s) => s.name === name);
      if (sampleItem?.src) this.playSample(sampleItem.src, time, settings);
    }
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

  public setVolume(value: number) {
    console.log("[setVolume] value: ", value);
    if (!this.mainVolume) throw "Missing GainNode! at setVolume";
    this.mainVolume.gain.value = value;
  }

  public defaultSoundSettings(): SoundSettings[] {
    console.log("THIS.CTX ", this.ctx);
    return [
      {
        name: "volume",
        node: new GainNode(this.ctx as AudioContext),
      },
    ];
  }
}

export default new Audio();

export const SAMPLES_DIRS = [
  {
    name: "bd",
    path: "bd.wav",
  },
  {
    name: "sd",
    path: "sd.wav",
  },

  {
    name: "hh",
    path: "hh.wav",
  },
  {
    name: "ht",
    path: "ht.wav",
  },
  {
    name: "oh",
    path: "oh.wav",
  },
  {
    name: "lt",
    path: "lt.wav",
  },
  {
    name: "mt",
    path: "mt.wav",
  },
  {
    name: "cp",
    path: "cp.wav",
  },
  {
    name: "rs",
    path: "rs.wav",
  },
];

type DefaultSampleType = {
  name: string;
  path: string;
  src: AudioBuffer;
};
