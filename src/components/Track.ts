import * as Tone from "tone";
import Audio from "./Audio.ts";
import type { Subscription } from "rxjs";
import Controls from "./Controls";
import type { TrackEffect } from "./types.ts";

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
  effects?: TrackEffect[];
  effectUpdateSubscription?: Subscription;
  channel?: Tone.Channel; // handle volume, pan, mute, solo

  constructor({ stepperId, name, samplePath }: TrackOptions) {
    this.name = name;
    this.stepperId = stepperId;
    if (samplePath) this.samplePath = samplePath;
  }

  async init() {
    this.loadSample();
    this.loadEffects();
  }

  private loadSample() {
    const fullPath = `${samplesDirPath}/${this.name}.wav`;
    const player = new Tone.Player(fullPath);
    this.source = player;
  }

  private loadEffects() {
    this.effects = Audio.defaultEffects;
    const effectNodes = this.effects?.map((effect) => effect.node);
    this.channel = new Tone.Channel();
    this.channel.set({ volume: -20 });
    this.source?.chain(...effectNodes, this.channel, Tone.getDestination());
  }

  public playSample(time: number = 0) {
    if (Controls.isPlaying)
      this.source?.start(time, 0, this.source.buffer.duration);
  }

  // init
  //  effects should be set to default effects (from Audio?)
  //  source must be created from path
}

export default Track;
