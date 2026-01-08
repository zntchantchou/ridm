import { Subject } from "rxjs";
import type {
  Effect,
  EffectState,
  StepperIdType,
  StepperResizeUpdate,
  SteppersState,
} from "./state.types";
import type { EffectNameType, EffectUpdate } from "../types";
import type { StepperOptions } from "../components/Stepper";
import {
  COLORS,
  DEFAULT_STEPPER_OPTIONS,
  INITIAL_EFFECTS,
  SAMPLES_DIRS,
} from "./state.constants";
import { generateRandomSteps } from "./state.utils";

// because effects affect sound even at 0 especially pitchShift
// they should be in a disconnected state, loaded only when activated and used

class State {
  // should be private
  private effects: EffectState;
  private steppers: SteppersState;

  currentStepperId = new Subject<StepperIdType>();
  effectUpdateSubject = new Subject<EffectUpdate>();
  stepperResizeSubject = new Subject<StepperResizeUpdate>();

  constructor() {
    const { effects, steppers } = this.getInitialState();
    this.effects = effects;
    this.steppers = steppers;
    this.effectUpdateSubject.subscribe(this.updateEffect);
  }
  // EFFECTS
  getInitialState() {
    const effects = new Map<StepperIdType, Effect[]>();
    const steppers = new Map<StepperIdType, StepperOptions>();
    for (let i = 0; i < 8; i++) {
      // const beats = Math.floor(Math.random() * 4) + 2;
      // const stepsPerBeat = Math.floor(Math.random() * 4) + 1; // deep copy
      const beats = DEFAULT_STEPPER_OPTIONS.beats;
      const stepsPerBeat = DEFAULT_STEPPER_OPTIONS.stepsPerBeat;
      effects.set(i as StepperIdType, INITIAL_EFFECTS);
      steppers.set(i as StepperIdType, {
        beats,
        stepsPerBeat,
        selectedSteps: generateRandomSteps({
          stepsPerBeat: stepsPerBeat,
          beats,
        }),
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
    updatedEffects[index] = { ...existingEffects[index], value: updatedValue };
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

  getStepperEffects(stepperId: StepperIdType) {
    return this.effects.get(stepperId);
  }

  getStepperOptions(stepperId: StepperIdType) {
    return this.steppers.get(stepperId);
  }
}

export default new State();
