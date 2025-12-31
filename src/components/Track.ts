import * as Tone from "tone";
import Audio from "./Audio.ts";
import { filter, type Subject, type Subscription } from "rxjs";
import Controls from "./Controls";
import type { EffectNameType, EffectUpdate, TrackEffect } from "./types.ts";

const samplesDirPath = "../../samples/defaults/";

export type TrackOptions = {
  name: string;
  stepperId: string;
  source?: Tone.Player;
  effects?: TrackEffect[];
  samplePath?: string;
  effectUpdateSubject: Subject<EffectUpdate>;
};

class Track {
  name: string;
  samplePath?: string;
  stepperId: string;
  source?: Tone.Player;
  effects?: TrackEffect[];
  effectUpdateSubscription?: Subscription;
  effectsInitialized = false;
  channel?: Tone.Channel; // handle volume, pan, mute, solo
  effectUpdateSubject: Subject<EffectUpdate>;
  updateMethodsMap: Map<EffectNameType, (update: EffectUpdate) => void> =
    new Map();

  constructor({
    stepperId,
    name,
    samplePath,
    effectUpdateSubject,
  }: TrackOptions) {
    this.name = name;
    this.stepperId = stepperId;
    this.effectUpdateSubject = effectUpdateSubject;
    if (samplePath) this.samplePath = samplePath;
  }

  async init() {
    Tone.setContext(Audio.ctx as Tone.Context);
    this.loadSample();
    this.loadEffects();
    this.initializeUpdateMethods();
    this.effectUpdateSubject
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
    const effectNodes = this.effects?.map(
      (effect) => effect.node
    ) as Tone.ToneAudioNode[];
    effectNodes.push(this.channel as Tone.ToneAudioNode);
    this.source?.chain(...effectNodes, Tone.getDestination());
  }

  private initializeEffects() {
    if (!this.channel) {
      this.channel = new Tone.Channel();
    }
    this.effects = Audio.defaultEffects;
    this.effectsInitialized = true;
  }

  public playSample(time: number = 0) {
    if (Controls.isPlaying)
      this.source?.start(time, 0, this.source.buffer.duration);
  }

  private handleEffectUpdate = (update: EffectUpdate) => {
    // console.log("[handleEffectUpdate] ", name, stepperId, value);
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
    console.log("Panning UPDATE");
    const v = value.value as Tone.ChannelOptions;
    this?.channel?.set({ pan: v.pan });
  };

  private handleVolumeUpdate = (value: EffectUpdate) => {
    console.log("Panning UPDATE");
    const v = value.value as Tone.ChannelOptions;
    this?.channel?.set({ volume: v.volume });
  };

  private handleDelayUpdate = (value: EffectUpdate) => {
    console.log("handleDelayUpdate UPDATE");
    const effect = this.effects?.find((e) => e.name === "delay");
    if (!effect) return;
    const delayOptions = value.value as Tone.FeedbackDelayOptions;
    effect?.node.set({ ...delayOptions });
  };

  private initializeUpdateMethods() {
    this.updateMethodsMap.set("solo", this.handleSoloUpdate);
    this.updateMethodsMap.set("mute", this.handleMuteUpdate);
    this.updateMethodsMap.set("panning", this.handlePanningUpdate);
    this.updateMethodsMap.set("volume", this.handleVolumeUpdate);
    this.updateMethodsMap.set("delay", this.handleDelayUpdate);
  }
}

export default Track;
