import * as Tone from "tone";
import type {
  EffectNameType,
  EffectValue,
  ToneSoundSettings,
  TrackEffect,
} from "../types";
import { INITIAL_EFFECTS } from "../state/state.constants";

class Audio {
  ctx: Tone.Context | null = null;
  volume: Tone.Volume | null = null;
  panning: Tone.Panner | null = null;
  defaultSamples: DefaultSampleType[] = [];
  soundSettings: ToneSoundSettings[] = [];

  public async init(toneContext: Tone.Context) {
    if (!toneContext)
      throw Error("Must initialize audioContext with shared audiocontext ");
    this.ctx = toneContext;
    Tone.setContext(toneContext);
    if (this.ctx) {
      this.volume = new Tone.Volume({ volume: 0 });
      this.panning = new Tone.Panner({ pan: 0 });
    }
  }

  public async start() {
    console.log("AUDIO START");
    await Tone.start();
  }

  public setMasterVolume(value: number) {
    this.volume?.set({ volume: value });
  }

  public setMasterPanning(value: number) {
    this.panning?.set({ pan: value });
  }

  public getMasterNodes(): Tone.ToneAudioNode[] {
    return [
      this.panning as Tone.ToneAudioNode,
      this.volume as Tone.ToneAudioNode,
    ];
  }

  public createEffect(
    name: EffectNameType,
    value: EffectValue
  ): Tone.ToneAudioNode {
    switch (name) {
      case "reverb":
        return new Tone.Reverb(value);
      case "pitch":
        return new Tone.PitchShift(value);
      case "delay":
        return new Tone.FeedbackDelay(value);
      case "volume":
        return new Tone.Volume(value);
      default:
        throw new Error(`Effect ${name} not recognized`);
    }
  }

  public get defaultEffects(): TrackEffect[] {
    return INITIAL_EFFECTS.map((effect) => {
      const node = this.createEffect(effect.name, effect.value);
      return {
        name: effect.name,
        node,
      };
    });
  }

  get currentTime() {
    return this.ctx?.currentTime;
  }
}

export default new Audio();

type DefaultSampleType = {
  name: string;
  path: string;
  src?: Tone.Player;
  effects?: Tone.ToneAudioNode[];
};
