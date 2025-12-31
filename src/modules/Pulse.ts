import { Subject } from "rxjs";
import type Stepper from "../components/Stepper";
import Controls from "../components/Controls";
import StepQueue, { type Step } from "./StepQueue";

class Pulse {
  readonly steps: number;

  private steppers: Set<Stepper>;

  private subs: Pulse[] | null;

  /** Whether this pulse is a lead (actively ticking) or child (passive, listening) */
  lead: boolean;

  currentStepSubject: Subject<{
    stepNumber: number;
    totalSteps: number;
    time: number;
  }>;
  private nextNoteTime: number = 0;
  private currentStep: number = 0;
  constructor(steps: number, lead: boolean = true) {
    if (steps < 1) {
      throw new Error(`Pulse steps must be >= 1, got ${steps}`);
    }

    this.steps = steps;
    this.steppers = new Set<Stepper>();
    this.subs = null;
    this.lead = lead;
    this.currentStepSubject = new Subject();
  }

  next() {
    if (this.currentStep < this.steps - 1) {
      this.currentStep++;
    } else {
      this.currentStep = 0;
    }
    this.nextNoteTime += this.getTps();
  }

  /** look to discover next steps to add within the buffer's window (nextNoteWindowMs) */
  discover(audioContextTime: number, discoverWindow: number) {
    while (this.nextNoteTime < audioContextTime + discoverWindow) {
      this.pulsate(this.currentStep, this.nextNoteTime);
      this.next();
    }
  }

  getTps() {
    return Controls.tpc / this.steps;
  }

  get empty() {
    return !this.subs || this.subs?.length === 0;
  }

  /** calculate sub pulse current step based on its parent */
  getCurrentStep(parentStep: Step) {
    const parentChildRatio = parentStep.totalSteps / this.steps;
    return Math.floor(parentStep.stepNumber / parentChildRatio);
  }

  /** calculate sub pulse previous step based on its parent */
  getPrevStep(parentStep: Step) {
    const parentChildRatio = parentStep.totalSteps / this.steps;
    const prevStep =
      parentStep.stepNumber === 0
        ? this.steps - 1
        : Math.floor(parentStep.stepNumber / parentChildRatio) - 1;
    return prevStep;
  }

  addStepper(stepper: Stepper): void {
    this.steppers.add(stepper);
  }

  removeStepper(stepper: Stepper): boolean {
    this.steppers.delete(stepper);
    return this.steppers.size === 0;
  }

  hasSteppers(): boolean {
    return this.steppers.size > 0;
  }

  /**
   * Gets the set of steppers listening to this pulse.
   */
  getSteppers(): Set<Stepper> {
    return new Set(this.steppers);
  }

  /**
   * Adds a child pulse to this pulse's subs array.
   */
  addSub(pulse: Pulse): void {
    if (this.subs === null) {
      this.subs = [];
    }

    if (!this.subs.includes(pulse)) {
      this.subs.push(pulse);
    }
  }

  /** Removes a child pulse from this pulse's subs array. */
  removeSub(pulse: Pulse): void {
    if (this.subs === null) return;

    const index = this.subs.indexOf(pulse);
    if (index !== -1) {
      this.subs.splice(index, 1);
    }
  }

  clearSubs(): void {
    this.subs = null;
  }

  /**
   * return array of children pulses.
   */
  getSubs(): Pulse[] | null {
    return this.subs === null ? null : [...this.subs];
  }

  hasSubs(): boolean {
    return this.subs !== null && this.subs.length > 0;
  }

  /**
   * Gets the count of steppers listening to this pulse.
   */
  get count(): number {
    return this.steppers.size;
  }

  /**
   * Gets all steppers from child pulses (one level deep).
   * Does NOT include steppers from this pulse itself.
   */
  getChildrenSteppers(): Stepper[] {
    if (!this.hasSubs()) return [];

    const childSteppers: Stepper[] = [];
    for (const childPulse of this.subs!) {
      childSteppers.push(...childPulse.steppers);
    }
    return childSteppers;
  }

  /**
   * Gets all steppers from this pulse AND all descendant pulses (recursive).
   */
  getAllSteppers(): Stepper[] {
    const allSteppers: Stepper[] = [...this.steppers];

    if (this.hasSubs()) {
      for (const childPulse of this.subs!) {
        allSteppers.push(...childPulse.getAllSteppers());
      }
    }

    return allSteppers;
  }

  /**
   * Checks if this pulse can be a parent of a pulse with the given steps.
   */
  isParentOf(steps: number): boolean {
    return this.steps % steps === 0;
  }

  /**
   * Checks if this pulse can be a child of a pulse with the given steps.
   */
  isChildOf(steps: number): boolean {
    return steps % this.steps === 0;
  }

  /**
   * Notifies all steppers listening to this pulse of the current step.
   */
  pulsate(stepNumber: number, time: number): void {
    const nextStep = {
      stepNumber,
      totalSteps: this.steps,
      time,
    };
    // if (typeof Audio.currentTime === "number" && time < Audio.currentTime)
    //   return;

    StepQueue.push(nextStep); // Cons
    this.currentStepSubject.next(nextStep);
  }

  /**
   * Returns a string representation of this pulse for debugging.
   */
  toString(): string {
    const leadStr = this.lead ? "LEAD" : "child";
    const subsStr =
      this.subs === null
        ? "null"
        : `[${this.subs.map((s) => s.steps).join(", ")}]`;
    return `Pulse(${this.steps}, ${leadStr}, steppers=${this.count}, subs=${subsStr})`;
  }

  /**
   * Cleanup method to unsubscribe all observables.
   * Should be called before deleting a pulse.
   */
  destroy(): void {
    this.currentStepSubject.complete();
    this.steppers.clear();
    this.subs = null;
  }
}

export default Pulse;
