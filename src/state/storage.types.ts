import type { StepperIdType, Settings } from "./state.types";
import type { EffectNameType, EffectValue } from "../types";
import type { StepperColorType } from "../components/Stepper";

export interface PersistedState {
  effects: SerializedEffectsState;
  steppers: SerializedSteppersState;
  settings: Settings;
  lastUpdated: number;
}

export type SerializedEffectsState = {
  stepperId: StepperIdType;
  effects: SerializedEffect[];
}[];

export type SerializedEffect = {
  name: EffectNameType;
  value: EffectValue;
};

export type SerializedSteppersState = {
  id: StepperIdType;
  beats: number;
  stepsPerBeat: number;
  selectedSteps: boolean[];
  color: StepperColorType;
  sampleName: string;
}[];
