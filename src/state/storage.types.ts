import type { StepperIdType, Settings, ChannelOptions } from "./state.types";
import type { EffectNameType, EffectValue } from "../types";

export interface PersistedState {
  effects: SerializedEffectsState;
  steppers: SerializedSteppersState;
  channels: SerializedChannelsState;
  settings: Settings;
  tracks: SerializedTracksState;
  lastUpdated: number;
}

export type SerializedTracksState = {
  stepperId: StepperIdType;
  sampleId: string;
}[];

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
  color: { cssColor: string };
}[];

export type SerializedChannelsState = {
  stepperId: StepperIdType;
  channelOptions: ChannelOptions;
}[];
