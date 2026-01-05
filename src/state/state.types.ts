import type { EffectNameType, EffectValue } from "../types";

export type StepperIdType = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type Effect = {
  name: EffectNameType;
  value: EffectValue;
};

export type EffectState = Map<StepperIdType, Effect[]>;
