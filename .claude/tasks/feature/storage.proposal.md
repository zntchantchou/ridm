# LocalStorage Architecture Proposal

## Overview

This document proposes the architecture for persisting the application state (effects and steppers) to localStorage. The persistence layer will be reactive, automatically saving state changes through RxJS observables with debouncing to handle rapid user interactions.

## Storage Key

```typescript
const STORAGE_KEY = "riddim-sequencer-state";
```

## Data Structure

### Root Object Shape

```typescript
interface PersistedState {
  version: string; // e.g., "1.0.0" for future migrations
  effects: SerializedEffectsState;
  steppers: SerializedSteppersState;
  lastUpdated: number; // timestamp
}
```

### Serialized Effects

```typescript
// Effects Map → Array of objects for JSON serialization
type SerializedEffectsState = {
  stepperId: StepperIdType;
  effects: SerializedEffect[];
}[];

type SerializedEffect = {
  name: EffectNameType;
  value: EffectValue;
  // Note: 'node' property is OMITTED (not serializable)
};
```

**Example:**
```json
{
  "effects": [
    {
      "stepperId": 0,
      "effects": [
        { "name": "reverb", "value": { "decay": 2.5, "wet": 0.3 } },
        { "name": "delay", "value": { "delayTime": 0.5, "feedback": 0.4 } }
      ]
    },
    {
      "stepperId": 1,
      "effects": [...]
    }
  ]
}
```

### Serialized Steppers

```typescript
// Steppers Map → Array of objects for JSON serialization
type SerializedSteppersState = {
  id: StepperIdType;
  beats: number;
  stepsPerBeat: number;
  selectedSteps: boolean[];
  color: StepperColorType;
  sampleName: string;
}[];
```

**Example:**
```json
{
  "steppers": [
    {
      "id": 0,
      "beats": 4,
      "stepsPerBeat": 4,
      "selectedSteps": [true, false, false, false, true, false, false, false, ...],
      "color": { "name": "red", "cssColor": "#ff0000" },
      "sampleName": "kick"
    },
    {
      "id": 1,
      "beats": 4,
      "stepsPerBeat": 4,
      "selectedSteps": [...],
      "color": { "name": "blue", "cssColor": "#0000ff" },
      "sampleName": "snare"
    }
  ]
}
```

## Implementation Architecture

### 1. Storage Manager Class

Create a new file: `src/state/Storage.ts`

```typescript
import { debounceTime, merge } from "rxjs";
import State from "./State";
import type { PersistedState, SerializedEffect } from "./storage.types";

const STORAGE_KEY = "riddim-sequencer-state";
const VERSION = "1.0.0";
const DEBOUNCE_TIME_MS = 300; // Wait 300ms after last change

class Storage {
  constructor() {
    this.initializeStorage();
    this.setupSubscriptions();
  }

  /**
   * Initialize localStorage with default state if it doesn't exist
   */
  private initializeStorage(): void {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (!existing) {
      const initialState = this.serializeCurrentState();
      this.saveToLocalStorage(initialState);
    }
  }

  /**
   * Set up RxJS subscriptions to listen for state changes
   * Debounce to avoid excessive writes during rapid user interactions
   */
  private setupSubscriptions(): void {
    // Merge all state update subjects and debounce
    merge(
      State.effectUpdateSubject,
      State.stepperSelectedStepsSubject,
      State.stepperResizeSubject
    )
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
      version: VERSION,
      effects: this.serializeEffects(),
      steppers: this.serializeSteppers(),
      lastUpdated: Date.now(),
    };
  }

  /**
   * Convert effects Map to serializable array
   */
  private serializeEffects(): SerializedEffectsState {
    const effects: SerializedEffectsState = [];

    // Iterate through State's internal effects Map
    // (Would need to add a getter in State.ts to access private effects)
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
      console.log("[Storage] State persisted to localStorage");
    } catch (error) {
      console.error("[Storage] Failed to save to localStorage:", error);
      // Could be quota exceeded or other storage errors
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

      // Version check for future migrations
      if (state.version !== VERSION) {
        console.warn(`[Storage] Version mismatch: ${state.version} vs ${VERSION}`);
        // Could implement migration logic here
      }

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

export default new Storage();
```

### 2. Type Definitions

Create a new file: `src/state/storage.types.ts`

```typescript
import type { StepperIdType } from "./state.types";
import type { EffectNameType, EffectValue } from "../types";
import type { StepperColorType } from "../components/Stepper";

export interface PersistedState {
  version: string;
  effects: SerializedEffectsState;
  steppers: SerializedSteppersState;
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
```

### 3. State.ts Modifications

Add a public getter to access effects (currently private):

```typescript
// In State class
getAllEffects(): EffectState {
  return new Map(this.effects); // Return a copy
}
```

### 4. Initialization

In the main application entry point (likely where State is imported):

```typescript
import Storage from "./state/Storage";

// Storage will initialize automatically as a singleton
// and begin listening to State changes
```

## Access Patterns

### Reading from localStorage

```typescript
import Storage from "./state/Storage";

const persistedState = Storage.getPersistedState();

if (persistedState) {
  console.log("Last saved:", new Date(persistedState.lastUpdated));
  console.log("Effects:", persistedState.effects);
  console.log("Steppers:", persistedState.steppers);
}
```

### Writing to localStorage

Writing happens automatically through the reactive subscriptions. Any update to:
- `State.effectUpdateSubject`
- `State.stepperSelectedStepsSubject`
- `State.stepperResizeSubject`

Will trigger a debounced save after 300ms of inactivity.

### Manual Operations

```typescript
// Clear storage
Storage.clear();

// Force immediate save (if needed)
// Would need to expose persistState() as public method
```

## Update Flow Diagram

```
User Action (toggle step, change effect, resize stepper)
  ↓
Stepper/Component emits to State Subject
  ↓
State updates internal Map
  ↓
Storage's merged observable catches update
  ↓
debounceTime(300ms) waits for activity to settle
  ↓
serializeCurrentState() creates PersistedState object
  ↓
JSON.stringify() converts to string
  ↓
localStorage.setItem() persists to browser storage
```

## Benefits of This Architecture

1. **Reactive**: Automatically persists changes without manual calls
2. **Efficient**: Debouncing prevents excessive writes during rapid interactions
3. **Separation of Concerns**: Storage logic is isolated from State logic
4. **Type-Safe**: Full TypeScript support with proper types
5. **Extensible**: Version field allows for future migrations
6. **Error Handling**: Graceful handling of quota exceeded and parsing errors
7. **Testable**: Storage class can be tested independently

## Future Considerations

### Loading from localStorage (Phase 2)

When ready to implement loading:

```typescript
// In State.ts constructor or initialization method
private loadFromStorage(): void {
  const persisted = Storage.getPersistedState();

  if (persisted) {
    // Restore effects
    for (const { stepperId, effects } of persisted.effects) {
      // Set effects (nodes will be created by Audio module)
      this.effects.set(stepperId, effects as Effect[]);
    }

    // Restore steppers
    for (const stepperData of persisted.steppers) {
      this.steppers.set(stepperData.id, stepperData);
    }
  }
}
```

### Migration Strategy

If the data structure changes in the future:

```typescript
private migrateState(state: any, fromVersion: string): PersistedState {
  if (fromVersion === "1.0.0" && VERSION === "2.0.0") {
    // Migration logic here
  }
  return state;
}
```

## Storage Size Estimate

For 8 steppers with typical settings:
- Effects: ~2KB (depends on effect count and values)
- Steppers: ~1-2KB (selectedSteps array is main contributor)
- **Total: ~3-4KB**

This is well within localStorage limits (typically 5-10MB per domain).
