import { debounceTime, merge, Subject } from "rxjs";
import State from "./State";
import type {
  PersistedState,
  SerializedEffectsState,
  SerializedSteppersState,
} from "./storage.types";
import type {
  StepperIdType,
  EffectState,
  SteppersState,
  AppState,
  StateUpdates,
} from "./state.types";

const STORAGE_KEY = "riddim-sequencer-state";
const DEBOUNCE_TIME_MS = 300; // Wait 300ms after last change

type InitializeOptions = {
  effects: EffectState;
  steppers: SteppersState;
  settings: AppState["settings"];
  subjects: Subject<StateUpdates>[];
};
class Storage {
  hasState(): boolean {
    const existing = localStorage.getItem(STORAGE_KEY);
    return !!existing;
  }

  initialize(state: InitializeOptions): void {
    this.initializeStorage(state);
    this.setupSubscriptions(state.subjects);
  }
  /**
   * Initialize localStorage with default state if it doesn't exist
   */
  private initializeStorage(state: AppState): void {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (!existing) {
      const initialState = this.serializeInitialState(state);
      this.saveToLocalStorage(initialState);
      return;
    }
  }

  private serializeInitialState(state: AppState): PersistedState {
    return {
      effects: this.serializeInitialEffects(state.effects),
      steppers: this.serializeInitialSteppers(state.steppers),
      settings: state.settings,
      lastUpdated: Date.now(),
    };
  }
  /**
   * Set up RxJS subscriptions to listen for state changes
   * Debounce to avoid excessive writes during rapid user interactions
   */
  private setupSubscriptions(subjects: Subject<StateUpdates>[]): void {
    // Merge all state update subjects and debounce
    merge(...subjects)
      .pipe(debounceTime(DEBOUNCE_TIME_MS))
      .subscribe(() => {
        this.persistState();
      });
  }

  /**
   * Serialize current state from State singleton
   */
  private serializeCurrentState(): PersistedState {
    return {
      effects: this.serializeEffects(),
      steppers: this.serializeSteppers(),
      settings: State.getSettings(),
      lastUpdated: Date.now(),
    };
  }

  /**
   * Convert effects Map to serializable array
   */
  private serializeEffects(): SerializedEffectsState {
    const effects: SerializedEffectsState = [];

    for (let i = 0; i < 8; i++) {
      const stepperId = i as StepperIdType;
      const stepperEffects = State.getStepperEffects(stepperId);

      if (stepperEffects) {
        effects.push({
          stepperId,
          effects: stepperEffects.map(({ name, value }) => ({
            name,
            value,
            // Omit 'node' - it will be recreated on load
          })),
        });
      }
    }

    return effects;
  }
  private serializeInitialEffects(
    effects: EffectState,
  ): SerializedEffectsState {
    const serialized: SerializedEffectsState = [];

    for (let i = 0; i < 8; i++) {
      const stepperId = i as StepperIdType;
      const stepperEffects = effects.get(stepperId);
      if (stepperEffects) {
        serialized.push({
          stepperId,
          effects: stepperEffects.map(({ name, value }) => ({
            name,
            value,
          })),
        });
      }
    }
    return serialized;
  }

  /**
   * Convert steppers Map to serializable array
   */
  private serializeSteppers(): SerializedSteppersState {
    const steppers: SerializedSteppersState = [];

    for (let i = 0; i < 8; i++) {
      const stepperId = i as StepperIdType;
      const stepperOptions = State.getStepperOptions(stepperId);

      if (stepperOptions) {
        steppers.push({
          id: stepperOptions.id,
          beats: stepperOptions.beats,
          stepsPerBeat: stepperOptions.stepsPerBeat,
          selectedSteps: stepperOptions.selectedSteps || [],
          color: stepperOptions.color,
          sampleName: stepperOptions.sampleName,
        });
      }
    }

    return steppers;
  }

  private serializeInitialSteppers(
    steppers: SteppersState,
  ): SerializedSteppersState {
    const serialized: SerializedSteppersState = [];

    for (let i = 0; i < 8; i++) {
      const stepperId = i as StepperIdType;
      const stepperOptions = steppers.get(stepperId);

      if (stepperOptions) {
        serialized.push({
          id: stepperOptions.id,
          beats: stepperOptions.beats,
          stepsPerBeat: stepperOptions.stepsPerBeat,
          selectedSteps: stepperOptions.selectedSteps || [],
          color: stepperOptions.color,
          sampleName: stepperOptions.sampleName,
        });
      }
    }

    return serialized;
  }

  /**
   * Persist current state to localStorage
   */
  private persistState(): void {
    const state = this.serializeCurrentState();
    this.saveToLocalStorage(state);
  }

  /**
   * Write to localStorage with error handling
   */
  private saveToLocalStorage(state: PersistedState): void {
    try {
      const serialized = JSON.stringify(state);
      localStorage.setItem(STORAGE_KEY, serialized);
    } catch (error) {
      console.error("[Storage] Failed to save to localStorage:", error);
    }
  }

  /**
   * Get current persisted state from localStorage
   */
  getPersistedState(): PersistedState | null {
    try {
      const serialized = localStorage.getItem(STORAGE_KEY);
      if (!serialized) return null;

      const state = JSON.parse(serialized) as PersistedState;
      return state;
    } catch (error) {
      console.error("[Storage] Failed to read from localStorage:", error);
      return null;
    }
  }

  /**
   * Clear persisted state (for debugging or reset)
   */
  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
    console.log("[Storage] Cleared localStorage");
  }
}

export default Storage;
