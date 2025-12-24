import { Subject } from "rxjs";
import type Stepper from "../Stepper";

/**
 * Pulse represents a timing pulse that notifies steppers at regular intervals.
 *
 * Key Design Principles:
 * - One Pulse instance per unique step count (steps are immutable)
 * - Tracks steppers via Set<Stepper> for O(1) operations and validation
 * - Maintains hierarchy of child pulses (flat structure)
 * - Can be either a "lead" pulse (active ticker) or child pulse (passive)
 *
 * Parent/Child Relationships:
 * - A pulse is a PARENT of another if: parent.steps % child.steps === 0
 *   Example: Pulse(16) is parent of Pulse(8) because 16 % 8 === 0
 * - A pulse is a CHILD of another if: parent.steps % child.steps === 0
 *   Example: Pulse(8) is child of Pulse(16) because 16 % 8 === 0
 *
 * Subs Semantics:
 * - `null` = this pulse has no children (either non-lead or lead with no subs)
 * - `[]` = this pulse has capacity for children (lead pulse that is/was a parent)
 */
class Pulse {
  /** Immutable identifier - the number of steps this pulse represents */
  readonly steps: number;

  /** Direct references to all steppers listening to this pulse */
  private steppers: Set<Stepper>;

  /** Child pulses in a flat structure. null = no children, [] = has/had children */
  private subs: Pulse[] | null;

  /** Whether this pulse is a lead (actively ticking) or child (passive) */
  lead: boolean;

  /** RxJS subject for notifying steppers of the current step */
  currentStepSubject: Subject<{ stepNumber: number; totalSteps: number; time: number }>;

  /**
   * Creates a new Pulse instance.
   * @param steps - The number of steps (immutable)
   * @param lead - Whether this is a lead pulse (default: true)
   */
  constructor(steps: number, lead: boolean = true) {
    if (steps < 1) {
      throw new Error(`Pulse steps must be >= 1, got ${steps}`);
    }

    this.steps = steps;
    this.steppers = new Set<Stepper>();
    this.subs = null; // Initially no children
    this.lead = lead;
    this.currentStepSubject = new Subject();
  }

  // ============================================================================
  // STEPPER MANAGEMENT
  // ============================================================================

  /**
   * Adds a stepper to this pulse's listener set.
   * @param stepper - The stepper to add
   */
  addStepper(stepper: Stepper): void {
    this.steppers.add(stepper);
  }

  /**
   * Removes a stepper from this pulse's listener set.
   * @param stepper - The stepper to remove
   * @returns true if the pulse should be deleted (no steppers remaining)
   */
  removeStepper(stepper: Stepper): boolean {
    this.steppers.delete(stepper);
    return this.steppers.size === 0;
  }

  /**
   * Checks if this pulse has any steppers listening to it.
   * @returns true if at least one stepper is listening
   */
  hasSteppers(): boolean {
    return this.steppers.size > 0;
  }

  /**
   * Gets the set of steppers listening to this pulse.
   * Returns a new Set to prevent external mutation.
   * @returns Set of steppers
   */
  getSteppers(): Set<Stepper> {
    return new Set(this.steppers);
  }

  // ============================================================================
  // HIERARCHY MANAGEMENT
  // ============================================================================

  /**
   * Adds a child pulse to this pulse's subs array.
   * Initializes subs array if it was null.
   * @param pulse - The child pulse to add
   */
  addSub(pulse: Pulse): void {
    // Initialize subs array if this is the first child
    if (this.subs === null) {
      this.subs = [];
    }

    // Avoid duplicates
    if (!this.subs.includes(pulse)) {
      this.subs.push(pulse);
    }
  }

  /**
   * Removes a child pulse from this pulse's subs array.
   * @param pulse - The child pulse to remove
   */
  removeSub(pulse: Pulse): void {
    if (this.subs === null) return;

    const index = this.subs.indexOf(pulse);
    if (index !== -1) {
      this.subs.splice(index, 1);
    }
  }

  /**
   * Clears all child pulses from this pulse's subs array.
   * Sets subs to null (semantic: no children).
   */
  clearSubs(): void {
    this.subs = null;
  }

  /**
   * Gets the array of child pulses.
   * Returns a shallow copy to prevent external mutation.
   * @returns Array of child pulses, or null if no children
   */
  getSubs(): Pulse[] | null {
    return this.subs === null ? null : [...this.subs];
  }

  /**
   * Checks if this pulse has any child pulses.
   * @returns true if subs is non-null and non-empty
   */
  hasSubs(): boolean {
    return this.subs !== null && this.subs.length > 0;
  }

  // ============================================================================
  // QUERY METHODS
  // ============================================================================

  /**
   * Gets the count of steppers listening to this pulse.
   * Derived property from steppers Set size.
   */
  get count(): number {
    return this.steppers.size;
  }

  /**
   * Gets all steppers from child pulses (one level deep).
   * Does NOT include steppers from this pulse itself.
   * @returns Array of steppers from all child pulses
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
   * Traverses the entire subtree.
   * @returns Array of all steppers in the hierarchy
   */
  getAllSteppers(): Stepper[] {
    const allSteppers: Stepper[] = [...this.steppers];

    if (this.hasSubs()) {
      for (const childPulse of this.subs!) {
        // Recursively collect steppers from entire subtree
        allSteppers.push(...childPulse.getAllSteppers());
      }
    }

    return allSteppers;
  }

  /**
   * Checks if this pulse can be a parent of a pulse with the given steps.
   * A pulse is a parent if its steps are evenly divisible by the child's steps.
   * @param steps - The potential child's step count
   * @returns true if this pulse can be a parent
   * @example
   * pulse(16).isParentOf(8) // true, because 16 % 8 === 0
   * pulse(16).isParentOf(7) // false, because 16 % 7 !== 0
   */
  isParentOf(steps: number): boolean {
    return this.steps % steps === 0;
  }

  /**
   * Checks if this pulse can be a child of a pulse with the given steps.
   * A pulse is a child if the parent's steps are evenly divisible by this pulse's steps.
   * @param steps - The potential parent's step count
   * @returns true if this pulse can be a child
   * @example
   * pulse(8).isChildOf(16) // true, because 16 % 8 === 0
   * pulse(7).isChildOf(16) // false, because 16 % 7 !== 0
   */
  isChildOf(steps: number): boolean {
    return steps % this.steps === 0;
  }

  // ============================================================================
  // NOTIFICATION
  // ============================================================================

  /**
   * Notifies all steppers listening to this pulse of the current step.
   * This is called by the Pulses manager during the tick cycle.
   * @param stepNumber - The current step number (0-indexed)
   * @param time - The audio context time for precise scheduling
   */
  notify(stepNumber: number, time: number): void {
    this.currentStepSubject.next({
      stepNumber,
      totalSteps: this.steps,
      time,
    });
  }

  // ============================================================================
  // UTILITY & DEBUG
  // ============================================================================

  /**
   * Returns a string representation of this pulse for debugging.
   * @returns String representation
   */
  toString(): string {
    const leadStr = this.lead ? "LEAD" : "child";
    const subsStr = this.subs === null ? "null" : `[${this.subs.map(s => s.steps).join(", ")}]`;
    return `Pulse(${this.steps}, ${leadStr}, steppers=${this.count}, subs=${subsStr})`;
  }

  /**
   * Validates the internal state of this pulse.
   * @returns true if state is valid, false otherwise
   */
  validateState(): boolean {
    // Subs should only exist for lead pulses or pulses that were lead
    // If non-lead, subs should be null (child pulses don't have subs)
    if (!this.lead && this.hasSubs()) {
      console.error(`Non-lead pulse ${this.steps} has subs:`, this.subs);
      return false;
    }

    // All subs should have smaller step counts (children have fewer steps than parent)
    if (this.hasSubs()) {
      for (const sub of this.subs!) {
        if (sub.steps >= this.steps) {
          console.error(`Pulse ${this.steps} has sub ${sub.steps} with >= steps`);
          return false;
        }

        // Verify parent-child relationship
        if (!this.isParentOf(sub.steps)) {
          console.error(`Pulse ${this.steps} has sub ${sub.steps} but not a valid parent`);
          return false;
        }
      }
    }

    return true;
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
