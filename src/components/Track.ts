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
    if (!this.channel) {
      this.channel = new Tone.Channel();
    }

    this.effects = Audio.defaultEffects;
    const effectNodes = this.effects?.map((effect) => effect.node);
    effectNodes.push(this.channel);
    this.source?.chain(...effectNodes, Tone.getDestination());
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
    this?.channel?.set({ solo: value.value.solo });
    this.source?.disconnect();
    this.loadEffects();
  };

  private handleMuteUpdate = (value: EffectUpdate) => {
    this?.channel?.set({ mute: value.value.mute });
    this.source?.disconnect();
    this.loadEffects();
  };

  private initializeUpdateMethods() {
    this.updateMethodsMap.set("solo", this.handleSoloUpdate);
    this.updateMethodsMap.set("mute", this.handleMuteUpdate);
  }
}

export default Track;
