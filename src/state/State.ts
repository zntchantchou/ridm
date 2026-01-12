import { BehaviorSubject, Subject } from "rxjs";
import type {
  Effect,
  EffectState,
  Settings,
  StateUpdates,
  StepperIdType,
  StepperResizeUpdate,
  StepperSelectedStepsUpdate,
  SteppersState,
} from "./state.types";
import type { EffectNameType, EffectUpdate } from "../types";
import type { StepperOptions } from "../components/Stepper";
import {
  COLORS,
  DEFAULT_STEPPER_OPTIONS,
  INITIAL_EFFECTS,
  INITIAL_SETTINGS,
  SAMPLES_DIRS,
} from "./state.constants";
import { generateRandomSteps } from "./state.utils";
import Storage from "./Storage";
import type { PersistedState } from "./storage.types";

// because effects affect sound even at 0 especially pitchShift
// they should be in a disconnected state, loaded only when activated and used

class State {
  // should be private
  private effects: EffectState;
  private steppers: SteppersState;
  private settings: Settings;
  steppersLoadingSubject = new BehaviorSubject<boolean>(false);
  currentStepperId = new Subject<StepperIdType>();
  effectUpdateSubject = new Subject<EffectUpdate>();
  stepperResizeSubject = new Subject<StepperResizeUpdate>();
  stepperSelectedStepsSubject = new Subject<StepperSelectedStepsUpdate>();
  tpcUpdateSubject = new Subject<number>();
  volumeUpdateSubject = new Subject<number>();
  storage: Storage = new Storage();

  constructor() {
    const { effects, steppers, settings } = this.storage.hasState()
      ? this.deserializeStoreState()
      : this.createInitialState();
    this.effects = effects;
    this.steppers = steppers;
    this.settings = settings;
    this.effectUpdateSubject.subscribe(this.updateEffect);
    this.stepperSelectedStepsSubject.subscribe(this.updateSelectedSteps);
    this.tpcUpdateSubject.subscribe(this.updateTpc);
    this.volumeUpdateSubject.subscribe(this.updateVolume);
    this.storage.initialize({
      effects,
      steppers,
      settings,
      subjects: [
        this.tpcUpdateSubject,
        this.volumeUpdateSubject,
        this.effectUpdateSubject,
        this.stepperSelectedStepsSubject,
        this.stepperResizeSubject,
      ] as Subject<StateUpdates>[],
    });
  }

  // This should only be called if there is no existing state in localStorage
  createInitialState() {
    const effects = new Map<StepperIdType, Effect[]>();
    const steppers = new Map<StepperIdType, StepperOptions>();
    for (let i = 0; i < 8; i++) {
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
    return { effects, steppers, settings: { ...INITIAL_SETTINGS } };
  }

  deserializeStoreState(): {
    steppers: SteppersState;
    effects: EffectState;
    settings: Settings;
  } {
    const {
      effects: storeEffects,
      steppers: storeSteppers,
      settings,
    } = this.storage.getPersistedState() as PersistedState;
    const effects = new Map<StepperIdType, Effect[]>();
    const steppers = new Map<StepperIdType, StepperOptions>();

    for (let i = 0; i < 8; i++) {
      effects.set(i as StepperIdType, storeEffects[i].effects);
      steppers.set(i as StepperIdType, storeSteppers[i]);
    }
    return { effects, steppers, settings };
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

  updateSelectedSteps = (update: StepperSelectedStepsUpdate) => {
    const { stepperId, selectedSteps } = update;
    const existingStepper = this.steppers.get(stepperId);
    if (!existingStepper) return;
    const updatedStepper = { ...existingStepper, selectedSteps };
    this.steppers.set(stepperId, updatedStepper);
  };

  updateTpc = (tpc: number) => {
    this.settings.tpc = tpc;
  };

  updateVolume = (volume: number) => {
    this.settings.volume = volume;
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

  getSettings() {
    return { ...this.settings };
  }
}

export default new State();
