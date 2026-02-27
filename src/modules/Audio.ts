import * as Tone from "tone";
import type {
  EffectNameType,
  EffectValue,
  ToneSoundSettings,
  TrackEffect,
} from "../types";
import {
  INITIAL_EFFECTS,
  INITIAL_SETTINGS,
  MIN_VOLUME_DB,
} from "../state/state.constants";
import State from "../state/State";

class Audio {
  ctx: Tone.Context | null = null;
  volume: Tone.Volume | null = null;
  defaultSamples: DefaultSampleType[] = [];
  soundSettings: ToneSoundSettings[] = [];
  minVolume = MIN_VOLUME_DB;
  lastVolume = 0;
  samplePreviewSource?: Tone.Player;

  public async init() {
    this.ctx = new Tone.Context();
    Tone.setContext(this.ctx);
    if (this.ctx) {
      this.volume = new Tone.Volume({
        volume: State.getSettings().volume || INITIAL_SETTINGS.volume,
      });
      this.ctx.resume();
    }
  }

  public async preview(samplePath: string) {
    try {
      const fullPath = "samples/machines/" + samplePath;
      if (!this.samplePreviewSource) {
        this.samplePreviewSource = new Tone.Player();
      }
      await this.samplePreviewSource.load(fullPath);
      this.samplePreviewSource.autostart = true;
      this.samplePreviewSource.chain(
        ...this.getMasterNodes(),
        Tone.getDestination(),
      );
    } catch (e) {
      // console.log("sample preview error: ", e);
    }
  }

  public getCurrentVolume() {
    return this.volume?.volume?.value;
  }

  public mute() {
    this.setMasterVolume(this.minVolume);
  }

  public setMasterVolume(value: number) {
    this.volume?.set({ volume: value });
  }

  public getMasterNodes(): Tone.ToneAudioNode[] {
    return [this.volume as Tone.ToneAudioNode];
  }

  public createEffect(
    name: EffectNameType,
    value: EffectValue,
  ): Tone.ToneAudioNode {
    switch (name) {
      case "reverb":
        return new Tone.Reverb(value as Tone.ReverbOptions);
      case "pitch":
        return new Tone.PitchShift(value);
      case "delay":
        return new Tone.FeedbackDelay(value as Tone.FeedbackDelayOptions);
      default:
        throw new Error(`Effect ${name} not recognized`);
    }
  }

  public getContext() {
    return this.ctx;
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
