/**
 * EXAMPLE: Stepper Integration with New Pulses System
 *
 * This file demonstrates how the existing Stepper class should be modified
 * to work with the new Pulses architecture.
 *
 * Key Changes:
 * 1. Stepper calls pulses.update() when its size changes
 * 2. No manual subscription management (Pulses handles it)
 * 3. Cleaner lifecycle (no manual unsubscribe before listenToPulse)
 */

import { filter, interval, Subscription, throttle } from "rxjs";
import type Pulse from "../experimental/Pulse";
import Pulses from "./Pulses";
// import Audio from "../Audio";
// import StepperControls from "../StepperControls";
// import Controls from "../Controls";

// Singleton instance of Pulses system
const pulsesSystem = new Pulses();

export interface StepperOptions {
  beats: number;
  stepsPerBeat: number;
  id: number;
  sampleName: string;
}

/**
 * MODIFIED Stepper class showing integration with new Pulses system.
 *
 * Changes from original:
 * - updateBeats() now calls pulsesSystem.update()
 * - updateStepsPerBeat() now calls pulsesSystem.update()
 * - listenToPulse() no longer needs manual unsubscribe (handled by Pulses)
 * - Constructor registers with Pulses
 * - stop() deregisters from Pulses
 */
class Stepper {
  id?: number;
  beats = 4;
  stepsPerBeat = 4;
  lastStep = -1;
  stepPickupRatio = 0;
  stepElements: HTMLDivElement[] = [];
  element: HTMLDivElement | null = null;
  pulseSubscription: Subscription | null = null;
  selectedSteps: boolean[] = Array(this.beats * this.stepsPerBeat).fill(false);
  // controls: StepperControls | null = null;
  justUpdated = false;
  sampleName: string;

  constructor({ beats, stepsPerBeat, id, sampleName }: StepperOptions) {
    this.beats = beats;
    this.stepsPerBeat = stepsPerBeat;
    this.id = id;
    this.sampleName = sampleName;

    // Register with Pulses system
    // This will create/find appropriate pulse and set up subscription
    pulsesSystem.register(this);

    // UI setup would happen here
    // this.controls = new StepperControls({...});
    // this.renderUi();
  }

  /**
   * Sets up subscription to a pulse.
   * Called by Pulses system during registration.
   */
  listenToPulse(pulse: Pulse) {
    // NOTE: In new system, Pulses handles unsubscribe during updates
    // We only unsubscribe here if we're setting up a new subscription
    this.pulseSubscription?.unsubscribe();

    this.pulseSubscription = pulse.currentStepSubject
      .pipe(
        filter(({ stepNumber, totalSteps }) =>
          this.isSelectedStep({ totalSteps, stepNumber })
        )
      )
      // .pipe(throttle(() => interval(Controls.tpc / this.steps)))
      .subscribe({
        next: ({ time }) => {
          // Audio.playDefaultSample(this.sampleName, time);
          console.log(
            `[Stepper ${this.id}] Playing ${this.sampleName} at ${time}`
          );
        },
        complete: () => {
          console.log("[STEPPER] PULSE HAS COMPLETED");
        },
      });
  }

  /**
   * Checks if a step should trigger based on pulse step and stepper configuration.
   */
  private isSelectedStep({
    totalSteps,
    stepNumber,
  }: {
    totalSteps: number;
    stepNumber: number;
  }) {
    if (totalSteps === this.steps) return !!this.selectedSteps[stepNumber];

    const parentChildRatio = totalSteps / this.steps;
    const actualStep = stepNumber / parentChildRatio;
    return Number.isInteger(actualStep) && !!this.selectedSteps[actualStep];
  }

  /**
   * Stops the stepper and deregisters from Pulses system.
   */
  stop() {
    pulsesSystem.deregister(this);
    this.pulseSubscription?.unsubscribe();
  }

  /**
   * Updates selected steps when stepper size changes.
   */
  updateSelectedSteps(targetSize: number) {
    const selectedSteps = this.getSelectedBeatAsNumber();
    const ratio = targetSize / this.steps;
    const updatedSteps = [];

    for (const step of selectedSteps) {
      if (step === 0) {
        updatedSteps.push(0);
        continue;
      }
      const nextSelectedStep = Math.floor(step * ratio);
      if (nextSelectedStep < 1) continue;
      updatedSteps.push(nextSelectedStep);
    }

    this.selectedSteps = this.convertNumbersToSteps(targetSize, updatedSteps);
  }

  /**
   * Updates the number of beats.
   * KEY CHANGE: Now calls pulsesSystem.update() to trigger atomic update.
   */
  updateBeats(beats: number) {
    const oldSteps = this.steps; // Store old value

    // Update selected steps for new size
    this.updateSelectedSteps(this.stepsPerBeat * beats);

    // Update beats
    this.beats = beats;

    // *** KEY CHANGE: Notify Pulses system of the change ***
    // This triggers atomic deregister -> register
    pulsesSystem.update(this, oldSteps, this.steps);

    // Update UI
    this.updateUi();
  }

  /**
   * Updates the steps per beat.
   * KEY CHANGE: Now calls pulsesSystem.update() to trigger atomic update.
   */
  updateStepsPerBeat(spb: number) {
    const oldSteps = this.steps; // Store old value

    // Update selected steps for new size
    this.updateSelectedSteps(this.beats * spb);

    // Update stepsPerBeat
    this.stepsPerBeat = spb;

    // *** KEY CHANGE: Notify Pulses system of the change ***
    // This triggers atomic deregister -> register
    pulsesSystem.update(this, oldSteps, this.steps);

    // Update UI
    this.updateUi();
  }

  convertNumbersToSteps(targetSize: number, numbers: number[]) {
    if (!numbers.length) return [];
    const steps: boolean[] = Array(targetSize)
      .fill(false)
      .map((_, i) => {
        return numbers.includes(i);
      });
    return steps;
  }

  getSelectedBeatAsNumber() {
    const selectedIndexes = [];
    for (const [index, selectedStep] of this.selectedSteps.entries()) {
      if (selectedStep) selectedIndexes.push(index);
    }
    return selectedIndexes;
  }

  updateUi() {
    // UI update logic would go here
    console.log(`[Stepper ${this.id}] UI updated for ${this.steps} steps`);
  }

  get steps() {
    return this.stepsPerBeat * this.beats;
  }
}

// ============================================================================
// EXAMPLE USAGE & SCENARIOS
// ============================================================================

/**
 * Example 1: Creating steppers in various orders
 */
function example1_OrderIndependence() {
  console.log("\n=== Example 1: Order Independence ===");

  const pulses = new Pulses();

  // Create steppers in random order: 16, 4, 64, 8
  const s1 = {
    id: 1,
    beats: 4,
    stepsPerBeat: 4,
    steps: 16,
    sampleName: "kick",
  } as Stepper;
  const s2 = {
    id: 2,
    beats: 1,
    stepsPerBeat: 4,
    steps: 4,
    sampleName: "snare",
  } as Stepper;
  const s3 = {
    id: 3,
    beats: 16,
    stepsPerBeat: 4,
    steps: 64,
    sampleName: "hh",
  } as Stepper;
  const s4 = {
    id: 4,
    beats: 2,
    stepsPerBeat: 4,
    steps: 8,
    sampleName: "clap",
  } as Stepper;

  pulses.register(s1);
  pulses.register(s2);
  pulses.register(s3);
  pulses.register(s4);

  console.log(pulses.toString());
  console.log("Valid:", pulses.validateState());

  // Expected: Pulse(64) is lead with subs [16, 8, 4]
}

/**
 * Example 2: Stepper update causing promotion
 */
function example2_UpdateWithPromotion() {
  console.log("\n=== Example 2: Update with Promotion ===");

  const pulses = new Pulses();

  // Create steppers: [64, 32, 16, 8]
  const s1 = {
    id: 1,
    beats: 16,
    stepsPerBeat: 4,
    steps: 64,
    sampleName: "kick",
  } as Stepper;
  const s2 = {
    id: 2,
    beats: 8,
    stepsPerBeat: 4,
    steps: 32,
    sampleName: "snare",
  } as Stepper;
  const s3 = {
    id: 3,
    beats: 4,
    stepsPerBeat: 4,
    steps: 16,
    sampleName: "hh",
  } as Stepper;
  const s4 = {
    id: 4,
    beats: 2,
    stepsPerBeat: 4,
    steps: 8,
    sampleName: "clap",
  } as Stepper;

  pulses.register(s1);
  pulses.register(s2);
  pulses.register(s3);
  pulses.register(s4);

  console.log("Initial state:");
  console.log(pulses.toString());

  // Update s1 from 64 to 63 steps
  console.log("\nUpdating s1 from 64 to 63 steps...");
  s1.beats = 15.75; // 15.75 * 4 = 63
  Object.defineProperty(s1, "steps", { value: 63, writable: true });
  pulses.update(s1, 64, 63);

  console.log("\nAfter update:");
  console.log(pulses.toString());
  console.log("Valid:", pulses.validateState());

  // Expected:
  // - Pulse(64) deleted
  // - Pulse(32) promoted to lead with subs [16, 8]
  // - Pulse(63) created as new lead (no relationship with others)
}

/**
 * Example 3: Multiple unrelated pulses
 */
function example3_UnrelatedPulses() {
  console.log("\n=== Example 3: Unrelated Pulses ===");

  const pulses = new Pulses();

  // Create steppers with prime step counts
  const s1 = {
    id: 1,
    beats: 7,
    stepsPerBeat: 1,
    steps: 7,
    sampleName: "kick",
  } as Stepper;
  const s2 = {
    id: 2,
    beats: 11,
    stepsPerBeat: 1,
    steps: 11,
    sampleName: "snare",
  } as Stepper;
  const s3 = {
    id: 3,
    beats: 13,
    stepsPerBeat: 1,
    steps: 13,
    sampleName: "hh",
  } as Stepper;

  pulses.register(s1);
  pulses.register(s2);
  pulses.register(s3);

  console.log(pulses.toString());
  console.log("Valid:", pulses.validateState());

  // Expected: All three pulses are leads with no subs
}

/**
 * Example 4: Deregistration with cleanup
 */
function example4_Deregistration() {
  console.log("\n=== Example 4: Deregistration ===");

  const pulses = new Pulses();

  // Create steppers: [64, 32, 16, 8]
  const s1 = {
    id: 1,
    beats: 16,
    stepsPerBeat: 4,
    steps: 64,
    sampleName: "kick",
  } as Stepper;
  const s2 = {
    id: 2,
    beats: 8,
    stepsPerBeat: 4,
    steps: 32,
    sampleName: "snare",
  } as Stepper;
  const s3 = {
    id: 3,
    beats: 4,
    stepsPerBeat: 4,
    steps: 16,
    sampleName: "hh",
  } as Stepper;
  const s4 = {
    id: 4,
    beats: 2,
    stepsPerBeat: 4,
    steps: 8,
    sampleName: "clap",
  } as Stepper;

  pulses.register(s1);
  pulses.register(s2);
  pulses.register(s3);
  pulses.register(s4);

  console.log("Initial state:");
  console.log(pulses.toString());

  // Deregister s1 (64 steps)
  console.log("\nDeregistering s1 (64 steps)...");
  pulses.deregister(s1);

  console.log("\nAfter deregistration:");
  console.log(pulses.toString());
  console.log("Valid:", pulses.validateState());

  // Expected:
  // - Pulse(64) deleted
  // - Pulse(32) promoted to lead with subs [16, 8]
}

/**
 * Example 5: Statistics
 */
function example5_Statistics() {
  console.log("\n=== Example 5: Statistics ===");

  const pulses = new Pulses();

  // Create various steppers
  const steppers = [
    { id: 1, beats: 4, stepsPerBeat: 4, steps: 16, sampleName: "kick" },
    { id: 2, beats: 4, stepsPerBeat: 4, steps: 16, sampleName: "kick2" }, // Duplicate
    { id: 3, beats: 2, stepsPerBeat: 4, steps: 8, sampleName: "snare" },
    { id: 4, beats: 1, stepsPerBeat: 4, steps: 4, sampleName: "hh" },
    { id: 5, beats: 7, stepsPerBeat: 1, steps: 7, sampleName: "perc" }, // Unrelated
  ] as Stepper[];

  for (const stepper of steppers) {
    pulses.register(stepper);
  }

  console.log(pulses.toString());
  console.log("\nStatistics:", pulses.getStats());
  console.log("Valid:", pulses.validateState());

  // Expected:
  // - 4 total pulses (16, 8, 4, 7)
  // - 2 lead pulses (16, 7)
  // - 5 total steppers
  // - Pulse(16) has 2 steppers
}

// Export examples for testing
export {
  pulsesSystem,
  example1_OrderIndependence,
  example2_UpdateWithPromotion,
  example3_UnrelatedPulses,
  example4_Deregistration,
  example5_Statistics,
};

// ============================================================================
// MIGRATION GUIDE
// ============================================================================

/**
 * MIGRATION CHECKLIST for integrating new Pulses system:
 *
 * 1. Create singleton Pulses instance
 *    - const pulsesSystem = new Pulses();
 *
 * 2. Update Stepper constructor:
 *    - Add: pulsesSystem.register(this);
 *    - Remove: Manual pulse selection/creation logic
 *
 * 3. Update Stepper.updateBeats():
 *    - Store oldSteps before changing this.beats
 *    - After updating this.beats, call: pulsesSystem.update(this, oldSteps, this.steps)
 *
 * 4. Update Stepper.updateStepsPerBeat():
 *    - Store oldSteps before changing this.stepsPerBeat
 *    - After updating this.stepsPerBeat, call: pulsesSystem.update(this, oldSteps, this.steps)
 *
 * 5. Update Stepper.stop():
 *    - Add: pulsesSystem.deregister(this);
 *    - Keep: this.pulseSubscription?.unsubscribe();
 *
 * 6. Update Stepper.listenToPulse():
 *    - No changes needed! Pulses system handles calling this method.
 *
 * 7. Remove old Pulses class and Pulse class:
 *    - After testing, delete /src/components/Pulses.ts
 *    - Delete /src/components/Pulse.ts
 *    - Rename /src/components/experimental/* to /src/components/*
 *
 * 8. Update imports:
 *    - Change imports from old Pulse/Pulses to new ones
 *
 * 9. Testing:
 *    - Test order independence: register steppers in various orders
 *    - Test updates: change beats/stepsPerBeat and verify hierarchy reorganization
 *    - Test deregistration: remove steppers and verify cleanup
 *    - Test validation: call pulsesSystem.validateState() to ensure consistency
 *
 * 10. Performance testing:
 *     - Test with 50+ steppers to verify O(log n) performance
 *     - Monitor memory usage during registration/deregistration cycles
 */
