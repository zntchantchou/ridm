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
  defaultSamples: DefaultSampleType[] = [];
  soundSettings: ToneSoundSettings[] = [];

  public async init(toneContext: Tone.Context) {
    if (!toneContext)
      throw Error("Must initialize audioContext with shared audiocontext ");
    this.ctx = toneContext;
    Tone.setContext(toneContext);
    if (this.ctx) {
      this.volume = new Tone.Volume({ volume: 0 });
    }
  }

  public setMasterVolume(value: number) {
    this.volume?.set({ volume: value });
  }

  public getMasterNodes(): Tone.ToneAudioNode[] {
    return [this.volume as Tone.ToneAudioNode];
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
      case "panning":
        return new Tone.Panner(value);
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
