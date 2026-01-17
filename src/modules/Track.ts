import * as Tone from "tone";
import Audio from "./Audio.ts";
import { filter, type Subscription } from "rxjs";
import Controls from "../components/Controls";
import type {
  EffectNameType,
  EffectUpdate,
  PitchOptions,
  TrackEffect,
} from "../types.ts";
import State from "../state/State.ts";
import type { StepperIdType } from "../state/state.types.ts";

const samplesDirPath = "../../samples/defaults/";
const DEFAULT_SAMPLE_RATE = 1;
const MIN_SAMPLE_RATE = 0.25;
const MAX_SAMPLE_RATE = 3;
export type TrackOptions = {
  name: string;
  stepperId: string;
  source?: Tone.Player;
  effects?: TrackEffect[];
  samplePath?: string;
  sampleRate?: number;
};

class Track {
  name: string;
  samplePath?: string;
  sampleRate: number = 0;
  stepperId: string;
  source?: Tone.Player;

  effects: TrackEffect[] = [];
  effectUpdateSubscription?: Subscription;
  effectsInitialized = false;
  channel?: Tone.Channel; // handles volume, pan, mute, solo
  updateMethodsMap: Map<EffectNameType, (update: EffectUpdate) => void> =
    new Map();

  constructor({ stepperId, name, samplePath, sampleRate }: TrackOptions) {
    this.name = name;
    this.stepperId = stepperId;
    if (!Number.isNaN(sampleRate) && sampleRate) {
      this.sampleRate = sampleRate;
    }
    if (samplePath) this.samplePath = samplePath;
  }

  init() {
    Tone.setContext(Audio.ctx as Tone.Context);
    this.loadSample();
    this.loadEffects();
    this.initializeUpdateMethods();
    State.effectUpdateSubject
      .pipe(
        filter((update: EffectUpdate) => update.stepperId === this.stepperId),
      )
      .subscribe(this.handleEffectUpdate);
  }

  private loadSample() {
    const fullPath = `${samplesDirPath}/${this.name}.wav`;
    this.source = new Tone.Player(fullPath);
    const storedPitch = State.getEffect({
      trackId: parseInt(this.stepperId) as StepperIdType,
      name: "pitch",
    })?.value as PitchOptions;
    this.source.playbackRate = this.calculateSampleRate(storedPitch.pitch);
  }

  private loadEffects() {
    if (!this.effectsInitialized) this.initializeEffects();
    const trackNodes = this.effects?.map(
      (effect) => effect.node,
    ) as Tone.ToneAudioNode[];
    // Channel is added first so that the panning is done by our own Tone.Panner which is added after it
    trackNodes.unshift(this.channel as Tone.ToneAudioNode);
    this.source?.chain(
      ...trackNodes,
      ...Audio.getMasterNodes(),
      Tone.getDestination(),
    );
  }

  private initializeEffects() {
    const effects = State.getStepperEffects(
      parseInt(this.stepperId) as StepperIdType,
    );
    if (!this.channel) {
      this.channel = new Tone.Channel({});
    }
    if (effects) {
      this.effects = effects?.map((effect) => {
        const node = Audio.createEffect(effect.name, effect.value);
        return {
          name: effect.name,
          node,
        };
      });
    } else {
      this.effects = Audio.defaultEffects;
    }
    this.effectsInitialized = true;
  }

  public playSample(time: number = 0) {
    if (
      Controls.isPlaying &&
      this.source?.buffer &&
      this.source.buffer.loaded
    ) {
      this.source?.start(time, 0, this.source.buffer.duration);
    }
  }

  private handleEffectUpdate = (update: EffectUpdate) => {
    const updateFn = this.updateMethodsMap.get(update.name);
    if (updateFn) updateFn(update);
  };

  private handleSoloUpdate = (value: EffectUpdate) => {
    const v = value.value as Tone.ChannelOptions;
    this?.channel?.set({ solo: v.solo });
  };

  private handleMuteUpdate = (value: EffectUpdate) => {
    const v = value.value as Tone.ChannelOptions;
    this?.channel?.set({ mute: v.mute });
  };

  private handlePanningUpdate = (value: EffectUpdate) => {
    const effect = this.effects?.find((e) => e.name === "panning");
    if (!effect || !effect.node) return;
    const options = value.value as Tone.ChannelOptions;
    effect?.node.set({ ...options });
  };

  private handleVolumeUpdate = (value: EffectUpdate) => {
    const effect = this.effects?.find((e) => e.name === "volume");
    if (!effect || !effect.node) return;
    const options = value.value as Tone.ChannelOptions;
    effect?.node.set({ ...options });
  };

  private handleDelayUpdate = (value: EffectUpdate) => {
    const effect = this.effects?.find((e) => e.name === "delay");
    if (!effect || !effect.node) return;
    const delayOptions = value.value as Tone.FeedbackDelayOptions;
    effect?.node.set({ ...delayOptions });
  };

  private handleReverbUpdate = (value: EffectUpdate) => {
    const effect = this.effects?.find((e) => e.name === "reverb");
    if (!effect || !effect.node) return;
    const options = value.value as Tone.ReverbOptions;
    effect?.node.set({ ...options });
  };

  private handlePitchUpdate = (value: EffectUpdate) => {
    const pitchOptions = value.value as PitchOptions;
    const pitch = pitchOptions.pitch;
    this!.source!.playbackRate = this.calculateSampleRate(pitch);
  };

  private calculateSampleRate(pitch: number) {
    let ratio = DEFAULT_SAMPLE_RATE;
    if (pitch === 0) return ratio;
    if (pitch < 0) {
      const amplitude = 1 - MIN_SAMPLE_RATE;
      const stepValue = amplitude / (1 / MIN_SAMPLE_RATE);
      ratio = 1 - stepValue * Math.abs(pitch);
    }
    if (pitch > 0) {
      ratio = 1 + pitch * 0.5;
      ratio =
        1 +
        (pitch * (MAX_SAMPLE_RATE - DEFAULT_SAMPLE_RATE)) /
          (1 / MIN_SAMPLE_RATE);
    }
    return ratio;
  }

  private initializeUpdateMethods() {
    this.updateMethodsMap.set("solo", this.handleSoloUpdate);
    this.updateMethodsMap.set("mute", this.handleMuteUpdate);
    this.updateMethodsMap.set("panning", this.handlePanningUpdate);
    this.updateMethodsMap.set("volume", this.handleVolumeUpdate);
    this.updateMethodsMap.set("delay", this.handleDelayUpdate);
    this.updateMethodsMap.set("reverb", this.handleReverbUpdate);
    this.updateMethodsMap.set("pitch", this.handlePitchUpdate);
  }
}

export default Track;
