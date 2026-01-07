import * as Tone from "tone";
import Audio from "./Audio.ts";
import { filter, type Subscription } from "rxjs";
import Controls from "../components/Controls";
import type { EffectNameType, EffectUpdate, TrackEffect } from "../types.ts";
import State from "../state/state.ts";

const samplesDirPath = "../../samples/defaults/";

export type TrackOptions = {
  name: string;
  stepperId: string;
  source?: Tone.Player;
  effects?: TrackEffect[];
  samplePath?: string;
};

class Track {
  name: string;
  samplePath?: string;
  stepperId: string;
  source?: Tone.Player;
  effects: TrackEffect[] = [];
  effectUpdateSubscription?: Subscription;
  effectsInitialized = false;
  channel?: Tone.Channel; // handles volume, pan, mute, solo
  updateMethodsMap: Map<EffectNameType, (update: EffectUpdate) => void> =
    new Map();

  constructor({ stepperId, name, samplePath }: TrackOptions) {
    this.name = name;
    this.stepperId = stepperId;
    if (samplePath) this.samplePath = samplePath;
  }

  async init() {
    Tone.setContext(Audio.ctx as Tone.Context);
    this.loadSample();
    this.loadEffects();
    this.initializeUpdateMethods();
    State.effectUpdateSubject
      .pipe(
        filter((update: EffectUpdate) => update.stepperId === this.stepperId)
      )
      .subscribe(this.handleEffectUpdate);
  }

  private loadSample() {
    const fullPath = `${samplesDirPath}/${this.name}.wav`;
    const player = new Tone.Player(fullPath);
    this.source = player;
  }

  private loadEffects() {
    if (!this.effectsInitialized) this.initializeEffects();
    const trackNodes = this.effects?.map(
      (effect) => effect.node
    ) as Tone.ToneAudioNode[];
    trackNodes.push(this.channel as Tone.ToneAudioNode);
    this.source?.chain(
      ...trackNodes,
      ...Audio.getMasterNodes(),
      Tone.getDestination()
    );
  }

  private initializeEffects() {
    if (!this.channel) {
      this.channel = new Tone.Channel();
    }
    const effects = Audio.defaultEffects;
    if (effects) this.effects = effects;
    this.effectsInitialized = true;
  }

  public playSample(time: number = 0) {
    if (Controls.isPlaying)
      this.source?.start(time, 0, this.source.buffer.duration);
  }

  private handleEffectUpdate = (update: EffectUpdate) => {
    // console.log("[handleEffectUpdate] update ", update);
    const updateFn = this.updateMethodsMap.get(update.name);
    if (updateFn) updateFn(update);
  };

  private handleSoloUpdate = (value: EffectUpdate) => {
    const v = value.value as Tone.ChannelOptions;
    this?.channel?.set({ solo: v.solo });
    console.log("SETTING SOLO ", this.channel);
  };

  private handleMuteUpdate = (value: EffectUpdate) => {
    const v = value.value as Tone.ChannelOptions;
    this?.channel?.set({ mute: v.mute });
  };

  private handlePanningUpdate = (value: EffectUpdate) => {
    const v = value.value as Tone.ChannelOptions;
    this?.channel?.set({ pan: v.pan });
  };

  private handleVolumeUpdate = (value: EffectUpdate) => {
    const v = value.value as Tone.ChannelOptions;
    this?.channel?.set({ volume: v.volume });
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
    const effect = this.effects?.find((e) => e.name === "pitch");
    if (!effect || !effect.node) return;
    const pitchOptions = value.value as Tone.PitchShiftOptions;
    const options = { ...pitchOptions };
    if (typeof pitchOptions.pitch === "number") {
      options.pitch = Math.round(pitchOptions.pitch as number);
    }
    effect?.node.set({ ...options });
  };

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
