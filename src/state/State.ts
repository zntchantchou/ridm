import { Subject } from "rxjs";
import type {
  Effect,
  EffectState,
  StepperIdType,
  SteppersState,
} from "./state.types";
import type { EffectNameType, EffectUpdate } from "../types";
import type { StepperOptions } from "../components/Stepper";
import { COLORS, SAMPLES_DIRS } from "./state.constants";
import { generateRandomSteps } from "./state.utils";

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
  private steppers: SteppersState;

  currentStepperId = new Subject<StepperIdType>();
  effectUpdateSubject = new Subject<EffectUpdate>();

  constructor() {
    const { effects, steppers } = this.getInitialState();
    this.effects = effects;
    this.steppers = steppers;
    this.effectUpdateSubject.subscribe(this.updateEffect);
    console.log("State initialized", this);
  }
  // EFFECTS
  getInitialState() {
    const effects = new Map<StepperIdType, Effect[]>();
    const steppers = new Map<StepperIdType, StepperOptions>();

    for (let i = 0; i < 8; i++) {
      effects.set(i as StepperIdType, INITITAL_EFFECTS);
      steppers.set(i as StepperIdType, {
        beats: Math.floor(Math.random() * 8) + 1,
        stepsPerBeat: Math.floor(Math.random() * 8) + 1,
        selectedSteps: generateRandomSteps({ steps: 4, beats: 4 }),
        color: COLORS[i],
        sampleName: SAMPLES_DIRS[i].name,
        id: i as StepperIdType,
      });
    }
    return { effects, steppers };
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

  getInitialStepperOptions() {
    return Array.from(this.steppers.values());
  }
}

export default new State();
