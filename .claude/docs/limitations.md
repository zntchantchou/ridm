# Pulses get out of sync

## Situations that make this bug happen

- The time per cycle is updated, especially if updated to a value close to or lower than 2, even without updating the steps size.
- A step's size is updated once or multiple time at a time per close to or lower than 2.

## important Remarks

- Eventhough sometimes the sequencer freezes while playing, the visual highlighting is always in sync with the audio.
  But since the highlighted steps stop forming a vertical line and get arbitrarily highlighted, the resulting sound pattern is also wrong. You hear what you see, but what you see is wrong!
- If we have a stepper with 4 beats, this only represents a speed of 120bpm, which this software should be able to handle easily.

# Analysis Complete

## Root Causes of Pulse Desynchronization

After analyzing the Stepper, Pulse, Pulses, Ui, Controls, Timerworker, and StepQueue files, I've identified seven critical issues causing pulses to get out of sync:

### 1. **No Pulse State Synchronization During Updates** (CRITICAL)

**Location:** Pulses.ts:126-145 (update method), Pulse.ts:22-23 (constructor)

**Problem:** When `Stepper.updateSteps()` changes the step count, `Pulses.update()` deregisters and re-registers the stepper. During this process:

- New or reassigned Pulses are created with `currentStep = 0` and `nextNoteTime = 0`
- These initial values are completely out of sync with the ongoing playback
- The pulse doesn't inherit timing state from the currently playing sequence
- Result: The new pulse starts from beat 0 while other pulses continue from their current position

**Example:** If you're at step 12 of 16 and change to 8 steps, the new pulse starts at step 0 instead of calculating it should be at step 6 (12/16 \* 8).

### 2. **Stepper Throttle Creates Independent Timing** (CRITICAL) // FIXED, not throttle

**Location:** Stepper.ts:86

**Problem:**

```typescript
.pipe(throttle(() => interval(Controls.tpc / this.steps)))
```

- Creates a timing window independent of the actual pulse timing
- When `Controls.tpc` changes, existing subscriptions keep the old throttle interval
- Creates mismatch between when pulses emit and when steppers respond
- The throttle interval is calculated once at subscription time and never updates

**Impact:** At low TPC values (≤2), this timing drift compounds rapidly.

### 3. **Stepper Subscriptions Not Refreshed on TPC Change** (MAJOR) // FIXED, no throttle

**Location:** Controls.ts:32-37, Stepper.ts:78-90

**Problem:** When `Controls.tpc` is updated via the UI:

- The value changes immediately
- Steppers' existing subscriptions continue with their old throttle intervals
- No mechanism to refresh subscriptions with new timing
- Different steppers respond at different rates depending on when they subscribed

### 4. **Race Conditions During Hierarchy Reorganization** (MAJOR)

**Location:** Pulses.ts:44-90 (register method, especially Case 3)

**Problem:** When the pulse hierarchy reorganizes (adding a stepper that becomes new parent):

- Old lead pulses are demoted
- New lead pulse is promoted
- Child steppers are reassigned to new parent
- All happens while `Timerworker.tick()` may be calling `discover()` on these pulses
- No locking or coordination between the reorganization and the playback loop

**Result:** Pulses can emit steps while being reorganized, causing temporal inconsistencies.

### 5. **Discover Window vs Step Duration Mismatch** (MODERATE)

**Location:** Pulse.ts:45-49, Timerworker.ts:10

**Problem:**

- Discover window is fixed at 0.1 seconds
- At tpc=2 with 16 steps: step duration is 2/16 = 0.125 seconds
- At tpc=1 with 16 steps: step duration is 1/16 = 0.0625 seconds
- When step duration < discover window, many steps schedule in one tick
- Any timing drift gets multiplied across these batched steps
- The while loop in `discover()` can schedule 1-2 steps at normal speed but 5+ steps at low TPC

### 6. **No Timing Continuity in Pulse Hierarchy Changes** (MODERATE) // VERY VALID

**Location:** Pulses.ts:260-282 (promoteChild), Pulses.ts:71-72

**Problem:** When a pulse is promoted or demoted:

- Its `currentStep` and `nextNoteTime` remain from its previous role
- Child pulses inherit nothing from their parent's current timing
- Steppers are told to listen to a different pulse with different timing state
- No calculation to ensure the new pulse is at the equivalent position in its cycle

### 7. **UI and Audio on Different Clocks** (MINOR) // NO BUG YET

**Location:** Ui.ts:18 (requestAnimationFrame), Timerworker.ts:11 (25ms tick)

**Problem:**

- UI updates at ~60Hz (requestAnimationFrame)
- Audio scheduling at ~40Hz (25ms worker tick)
- These different rates can cause visual/audio desync, especially at fast tempos
- Not the root cause but makes the issue more visible

---

## Architectural Improvements

### Immediate Fixes (High Priority)

#### 1. **Remove Throttle from Stepper Subscriptions**

The throttle operator creates independent timing. Instead:

- Pulse already controls timing through `discover()`
- Steppers should respond to every pulse emission immediately
- Keep the step selection filter, remove the throttle
- Let audio scheduling timing be the single source of truth

**In Stepper.ts:86**, change from:

```typescript
.pipe(throttle(() => interval(Controls.tpc / this.steps)))
```

to simply remove this line entirely.

#### 2. **Synchronize Pulse Timing State During Creation**

When creating a new Pulse or reassigning steppers, calculate proper initial state:

**Add to Pulse constructor:**

```typescript
constructor(steps: number, lead: boolean = true, audioContextTime?: number, parentPulse?: Pulse) {
  this.steps = steps;
  this.lead = lead;

  if (audioContextTime && parentPulse) {
    // Sync with parent's current position
    const parentPosition = (audioContextTime - parentPulse.nextNoteTime) / parentPulse.getTps();
    const ratio = this.steps / parentPulse.steps;
    this.currentStep = Math.floor(parentPosition * ratio) % this.steps;
    this.nextNoteTime = audioContextTime;
  } else if (audioContextTime) {
    // At least start from current time
    this.nextNoteTime = audioContextTime;
  }

  // ... rest of constructor
}
```

#### 3. **Pause During Updates**

Simplest solution to avoid all race conditions:

**In Stepper.ts:125-141**, modify `updateSteps`:

```typescript
updateSteps = async ({ beats, stepsPerBeat }) => {
  const wasPlaying = Controls.isPlaying;

  // Pause playback
  if (wasPlaying) await Controls.togglePlay();

  // Perform update
  const oldSteps = this.steps;
  if (stepsPerBeat) this.stepsPerBeat = stepsPerBeat;
  if (beats) this.beats = beats;
  this.updateSelectedSteps(this.beats * this.stepsPerBeat);
  Pulses.update(this, oldSteps, this.steps);
  this.updateUi();

  // Resume playback
  if (wasPlaying) await Controls.togglePlay();
};
```

### Medium-Term Improvements

#### 4. **Single Source of Truth for Sequencer Time**

Create a global `SequencerState` class:

```typescript
class SequencerState {
  startTime: number = 0;
  tempo: number = 2; // tpc

  getCurrentBeat(audioContextTime: number): number {
    return (audioContextTime - this.startTime) / this.tempo;
  }

  getStepForPulse(audioContextTime: number, totalSteps: number): number {
    const beat = this.getCurrentBeat(audioContextTime);
    return Math.floor(beat * totalSteps) % totalSteps;
  }
}
```

Then Pulses become stateless calculators instead of maintaining their own `currentStep` and `nextNoteTime`.

#### 5. **Lock-Free Update via Immutable State**

Instead of mutating pulses during updates:

- Create new Pulse instances with correct state
- Update the `pulses` Map atomically
- Old pulses remain valid until next tick
- Avoids race conditions with `Timerworker.tick()`

#### 6. **Increase Debounce Time**

Current 200ms debounce is too short for rapid updates. Consider:

- 500ms for typical use
- 1000ms for very fast tempos
- This reduces reorganization frequency

**In Stepper.ts:17**, change:

```typescript
const DEBOUNCE_TIME_MS = 500; // or 1000
```

### Long-Term Architectural Refactoring

#### 7. **Pure Function Architecture**

Transform from stateful pulses to pure functions:

```typescript
interface SequencerState {
  globalTime: number;
  tempo: number;
  startTime: number;
}

function calculatePulseStep(state: SequencerState, pulseSteps: number): number {
  const elapsed = state.globalTime - state.startTime;
  const beatsElapsed = elapsed / state.tempo;
  return Math.floor(beatsElapsed * pulseSteps) % pulseSteps;
}
```

Benefits:

- No synchronization issues
- Updates are just new calculations
- Easy to test
- No race conditions

#### 8. **Separate Audio Scheduler from Pulse System**

Decouple audio timing from pulse emissions:

- Audio scheduler maintains precise timing
- Pulses become notification system only
- StepQueue becomes the interface between them
- UI reads from StepQueue independently

#### 9. **Consider Web Audio Clock API**

Instead of Web Worker ticking:

- Use `AudioContext.currentTime` as single time source
- Schedule callbacks using `AudioWorklet` or `ScriptProcessorNode`
- More precise timing than worker messages
- Better integration with Tone.js

---

## Testing Recommendations

To verify fixes:

1. **Tempo Stress Test**: Set TPC to 1.0, 16 steps, play for 60 seconds, verify vertical alignment
2. **Rapid Update Test**: Change step count every 500ms while playing, verify no freezing
3. **Multiple Stepper Test**: 4 steppers with different step counts (4, 8, 12, 16), verify synchronization
4. **Parent-Child Test**: Steppers at 4 and 16 steps (4:1 ratio), verify child hits every 4th step of parent

---

## Priority Recommendation

1. **Critical**: Implement fixes #1 (remove throttle) and #3 (pause during updates) immediately
2. **High**: Add fix #2 (timing synchronization) to handle updates without pause
3. **Medium**: Apply fix #6 (increase debounce) to reduce update frequency
4. **Long-term**: Consider pure function architecture (#7) for fundamental reliability
