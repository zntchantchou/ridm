import type { ToneAudioNode } from "tone";
import type Stepper from "./Stepper";

export type BeatMapType = Map<string, { steppers: Stepper[] }>;

export type SoundSettings = {
  name: string;
  node: AudioNode;
  options?: { [index: string]: string };
};

export type ToneSoundSettings = {
  name: string;
  node: ToneAudioNode;
  options?: { [index: string]: string };
};
