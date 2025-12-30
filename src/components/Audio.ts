import * as Tone from "tone";
// import { ToneAudioNode } from "tone";
import Controls from "./Controls";
import type { ToneSoundSettings } from "./types";

const samplesDirPath = "../../samples/defaults/";

class Audio {
  ctx: Tone.Context | null = null; // initiate at null?
  mainVolume: GainNode | null = null;
  defaultSamples: DefaultSampleType[] = [];

  public async init(audioContext: Tone.Context) {
    if (!audioContext)
      throw Error("Must initialize audioContext with shared audiocontext ");
    console.log("INIT");
    this.ctx = audioContext;
    Tone.setContext(this.ctx);
    this.preLoadDefaultSamples();
    await Tone.start();
    // this.mainVolume = new GainNode(this.ctx);
  }

  private preLoadDefaultSamples() {
    const samples = [];
    for (const { name, path } of SAMPLES_DIRS) {
      samples.push({
        name,
        path,
        src: this.loadSample(path),
      });
    }
    this.defaultSamples = samples;
  }

  private loadSample(path: string): Tone.Player | undefined {
    if (!this.ctx)
      throw Error("Must initialize audioContext with share audiocontext ");
    try {
      const fullPath = `${samplesDirPath}/${path}`;
      const player = new Tone.Player(fullPath);
      // connecting the audio graph at preload
      // if done at play time the volume will ramp up as audionodes are connected each time the sample plays...
      const effectChain = this.toneSoundSettings().map((s) => s.node);
      player.chain(...effectChain, Tone.getDestination());
      return player;
    } catch (e) {
      console.log("Error: ", e);
    }
  }

  public playSample(player: Tone.Player, time: number = 0) {
    if (!this.ctx || !Controls.isPlaying)
      throw Error("Must initialize audioContext with share audiocontext ");
    player.start(time, 0, player.buffer.duration);
  }

  async playDefaultSample(
    name: string,
    time: number,
    settings: ToneSoundSettings[]
  ) {
    const samplePath = SAMPLES_DIRS.find((s) => s.name === name);

    if (samplePath) {
      const sampleItem = this.defaultSamples.find((s) => s.name === name);
      if (sampleItem?.src) this.playSample(sampleItem.src, time, settings);
    }
  }

  public setVolume(value: number) {
    console.log("[setVolume] value: ", value);
    if (!this.mainVolume) throw "Missing GainNode! at setVolume";
    this.mainVolume.gain.value = value;
  }

  public toneSoundSettings(): ToneSoundSettings[] {
    return [
      {
        name: "delay",
        node: new Tone.PingPongDelay({
          delayTime: "0.3",
          feedback: 0.1,
          wet: 0.3,
        }),
      },
      {
        name: "pitch",
        node: new Tone.PitchShift({ pitch: 4 }),
        // because effects affect sound even at 0 especially pitchShift
        // they should be in a disconnected state and be loaded only when actually used (value !== default value)
      },
      {
        name: "volume",
        node: new Tone.Volume(-10),
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
  src?: Tone.Player;
};
