import { Subject } from "rxjs";
import type { Effect, EffectState, StepperIdType } from "./state.types";
import type { EffectNameType, EffectUpdate } from "../types";

// because effects affect sound even at 0 especially pitchShift
// they should be in a disconnected state and be loaded only when actually used (value !== default value)
const INITITAL_EFFECTS: Effect[] = [
  {
    name: "reverb",
    value: { decay: 0.001, preDelay: 0, wet: 0 },
  },
  {
    name: "pitch",
    value: { pitch: 1, windowSize: 0.1, wet: 0 },
  },
  {
    name: "delay",
    value: {
      delayTime: 0,
      feedback: 0,
      wet: 0,
    },
  },
  {
    name: "volume",
    value: {
      volume: 0,
    },
  },
];

class State {
  // should be private
  private effects: EffectState;
  currentStepperId = new Subject<StepperIdType>();
  effectUpdateSubject = new Subject<EffectUpdate>();

  constructor() {
    const initial = new Map<StepperIdType, Effect[]>();
    for (let i = 0; i < 8; i++) {
      initial.set(i as StepperIdType, INITITAL_EFFECTS);
    }
    this.effects = initial;
    this.effectUpdateSubject.subscribe(this.updateEffect);
  }

  updateEffect = (update: EffectUpdate) => {
    const id = parseInt(update.stepperId) as StepperIdType;
    const existingEffects = this.effects.get(id) as Effect[];
    if (!existingEffects) return;
    const index = existingEffects.findIndex((e) => e.name === update.name);
    if (index < 0) return;
    const updatedValue = { ...existingEffects[index].value, ...update.value };
    const updatedEffects = [...existingEffects];
    updatedEffects[index] = { ...existingEffects[index], value: updatedValue }; // Copy the Effect object too!
    this.effects.set(id, updatedEffects);
  };

  getEffect({
    trackId,
    name,
  }: {
    trackId: StepperIdType;
    name: EffectNameType;
  }) {
    return this.effects.get(trackId)?.find((e) => e.name === name);
  }
}

export default new State();
