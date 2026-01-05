import { Subject } from "rxjs";
import type { Effect, EffectState, StepperIdType } from "./state.types";
import type { EffectUpdate } from "../types";

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
      delayTime: "0",
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
  currentStepperId = new Subject<string>();
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
    const updatedEffects = this.effects.get(
      parseInt(update.stepperId) as StepperIdType
    );
    console.log("updateEffect :", updatedEffects);
    console.log("update object :", update);
  };
}
// The update Subject should be brought here

export default new State();
