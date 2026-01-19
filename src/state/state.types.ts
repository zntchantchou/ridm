import * as Tone from "tone";
import type { StepperOptions } from "../components/Stepper";
import type { EffectNameType, EffectUpdate, EffectValue } from "../types";

export type StepperIdType = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type Effect = {
  name: EffectNameType;
  value: EffectValue;
  node?: Tone.ToneAudioNode;
};

export type EffectState = Map<StepperIdType, Effect[]>;

export type StepperResizeUpdate = {
  stepperId: StepperIdType;
  stepsPerBeat?: number;
  beats?: number;
};

export type StepperSelectedStepsUpdate = {
  stepperId: StepperIdType;
  selectedSteps: boolean[];
};

export type Settings = {
  tpc: number;
  volume: number;
  selectedStepperId: StepperIdType;
};

export type SteppersState = Map<StepperIdType, StepperOptions>;

export type AppState = {
  steppers: SteppersState;
  effects: EffectState;
  settings: Settings;
};

export type StateUpdates =
  | StepperResizeUpdate
  | StepperSelectedStepsUpdate
  | EffectUpdate
  | { tpc: number }
  | { volume: number };

export type TemplateName = "nottoochaabi" | "mamakossa";
