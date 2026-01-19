import { BehaviorSubject, Subject, tap } from "rxjs";
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
import Controls from "../components/Controls";

class State {
  private effects: EffectState;
  private steppers: SteppersState;
  private settings: Settings;
  // audio updates
  effectUpdateSubject = new Subject<EffectUpdate>();
  tpcUpdateSubject = new Subject<number>();
  volumeUpdateSubject = new Subject<number>();
  // stepper updates
  steppersLoadingSubject = new BehaviorSubject<boolean>(false);
  currentStepperIdSubject = new Subject<StepperIdType>();
  stepperResizeSubject = new Subject<StepperResizeUpdate>();
  stepperSelectedStepsSubject = new Subject<StepperSelectedStepsUpdate>();

  storage: Storage = new Storage();

  constructor() {
    const { effects, steppers, settings } = this.storage.hasState()
      ? this.deserializeStoreState()
      : this.createInitialState();
    this.effects = effects;
    this.steppers = steppers;
    this.settings = settings;
    this.storage.initialize({
      effects,
      steppers,
      settings,
      subjects: [
        this.currentStepperIdSubject.pipe(
          tap((v) => this.updateSelectedStepperId(v)),
        ),
        this.effectUpdateSubject.pipe(tap((v) => this.updateEffect(v))),
        this.stepperSelectedStepsSubject.pipe(
          tap((v) => this.updateSelectedSteps(v)),
        ),
        this.tpcUpdateSubject.pipe(tap((v) => this.updateTpc(v))),
        this.stepperResizeSubject.pipe(tap((u) => this.updateStepperSize(u))),
        this.volumeUpdateSubject.pipe(tap((v) => this.updateVolume(v))),
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
    Controls.tpc = tpc;
  };

  updateVolume = (volume: number) => {
    this.settings.volume = volume;
  };

  updateStepperSize = (update: StepperResizeUpdate) => {
    const { stepperId, beats, stepsPerBeat } = update;
    const existingStepper = this.steppers.get(stepperId);
    if (!existingStepper) return;
    const updatedStepper = { ...existingStepper };
    if (beats !== undefined) updatedStepper.beats = beats;
    if (stepsPerBeat !== undefined) updatedStepper.stepsPerBeat = stepsPerBeat;
    this.steppers.set(stepperId, updatedStepper);
  };

  private updateSelectedStepperId(id: StepperIdType) {
    this.settings.selectedStepperId = id;
  }

  getSelectedStepperId() {
    return this.settings.selectedStepperId;
  }

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
