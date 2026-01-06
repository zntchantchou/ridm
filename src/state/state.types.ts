import * as Tone from "tone";
import type { StepperOptions } from "../components/Stepper";
import type { EffectNameType, EffectValue } from "../types";

export type StepperIdType = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type Effect = {
  name: EffectNameType;
  value: EffectValue;
  node?: Tone.ToneAudioNode;
};

export type EffectState = Map<StepperIdType, Effect[]>;

export type SteppersState = Map<StepperIdType, StepperOptions>;
