import * as Tone from "tone";
import type { ToneSoundSettings, TrackEffect } from "../types";

class Audio {
  ctx: Tone.Context | null = null;
  mainVolume: GainNode | null = null;
  defaultSamples: DefaultSampleType[] = [];
  soundSettings: ToneSoundSettings[] = [];

  public async init(toneContext: Tone.Context) {
    if (!toneContext)
      throw Error("Must initialize audioContext with shared audiocontext ");
    this.ctx = toneContext;
    Tone.setContext(toneContext);
  }

  public async start() {
    console.log("AUDIO START");
    await Tone.start();
  }

  public setVolume(value: number) {
    console.log("[setVolume] value: ", value);
    if (!this.mainVolume) throw "Missing GainNode! at setVolume";
    this.mainVolume.gain.value = value;
  }

  public get defaultEffects(): TrackEffect[] {
    // for each stepper effect values should be persisted
    return [
      {
        name: "reverb",
        node: new Tone.Reverb({ decay: 0.001, preDelay: 0, wet: 0 }),
      },
      {
        name: "pitch",
        node: new Tone.PitchShift({ pitch: 5, windowSize: 0.1, wet: 1 }),
        // because effects affect sound even at 0 especially pitchShift
        // they should be in a disconnected state and be loaded only when actually used (value !== default value)
      },
      {
        name: "delay",
        node: new Tone.FeedbackDelay({
          delayTime: "0",
          feedback: 0,
          wet: 0,
        }),
      },
      {
        name: "volume",
        node: new Tone.Volume(-10),
      },
    ];
  }

  get currentTime() {
    return this.ctx?.currentTime;
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
  effects?: Tone.ToneAudioNode[];
};
