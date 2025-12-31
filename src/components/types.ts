import * as Tone from "tone";
import type Stepper from "./Stepper";

export type BeatMapType = Map<string, { steppers: Stepper[] }>;

export type SoundSettings = {
  name: string;
  node: AudioNode;
  options?: { [index: string]: string };
};

export type ToneSoundSettings = {
  name: string;
  node: Tone.ToneAudioNode;
  options?: { [index: string]: string };
};

export type TrackEffect = {
  name: string;
  node: Tone.ToneAudioNode;
  options?: { [index: string]: string };
};

export type EffectNameType =
  | "pitch"
  | "volume"
  | "panning"
  | "delay"
  | "mute"
  | "solo";

export type EffectUpdate = {
  name: EffectNameType;
  stepperId: string;
  value: Partial<Tone.ChannelOptions | Tone.DelayOptions>;
};
