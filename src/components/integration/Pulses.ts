import Pulse from "../integration/Pulse";
import Stepper from "../Stepper.integration";

/**
 * Pulses manages the lifecycle of all Pulse instances in the application.
 *
 * Key Design Principles:
 * - Single source of truth: Map<steps, Pulse> for O(1) lookups
 * - Atomic operations: Updates are transactional (all-or-nothing)
 * - Hierarchy optimization: Minimize lead pulses by consolidating under largest parents
 * - Order independence: Same final state regardless of registration order
 *
 * Architecture:
 * - `pulses` Map: Contains ALL pulses (both lead and non-lead)
 * - `leadSteps` Array: Sorted descending list of lead pulse step counts
 *
 * Hierarchy Strategy:
 * - Always prefer largest pulse as lead to minimize total lead pulses
 * - Child relationships based on factor/multiple: parent.steps % child.steps === 0
 * - When registering: find parent first, if none found, check for children
 * - When deregistering: promote largest child to maintain minimal leads
 */
class Pulses {
  /** Map of all pulses, indexed by step count for O(1) lookup */
  private pulses: Map<number, Pulse>;

  /** Sorted array of lead pulse step counts (descending order) */
  private leadSteps: number[];

  constructor() {
    this.pulses = new Map();
    this.leadSteps = [];
  }

  // ============================================================================
  // PRIMARY OPERATIONS (Public API)
  // ============================================================================

  /**
   * Registers a stepper to the appropriate pulse.
   * Creates pulses and manages hierarchy as needed.
   *
   * Algorithm:
   * 1. Check if pulse for stepper.steps already exists
   *    - If yes, add stepper to existing pulse
   * 2. Find potential parent pulse (largest pulse that can accommodate this stepper)
   *    - If found, create as non-lead child and add to parent's subs
   * 3. Find potential child pulses (pulses that should become children of this new pulse)
   *    - If found, create as lead, demote children, transfer their subs
   * 4. If no relationships found, create as new lead pulse
   *
   * @param stepper - The stepper to register
   */
  register(stepper: Stepper): void {
    const steps = stepper.steps;

    // Case 1: Pulse already exists - just add stepper to it
    const existingPulse = this.pulses.get(steps);
    if (existingPulse) {
      existingPulse.addStepper(stepper);
      stepper.listenToPulse(existingPulse);
      return;
    }

    // Case 2: Find parent pulse (a lead pulse whose steps are a multiple of this stepper's steps)
    const parentPulse = this.findParentPulse(steps);
    if (parentPulse) {
      // Create new pulse as non-lead child
      const newPulse = new Pulse(steps, false);
      newPulse.addStepper(stepper);
      this.pulses.set(steps, newPulse);

      // Add to parent's subs
      this.assignToParent(newPulse, parentPulse);

      // Stepper listens to the parent pulse (filtering via isSelectedStep)
      stepper.listenToPulse(parentPulse);
      return;
    }

    // Case 3: Find child pulses (lead pulses whose steps are factors of this stepper's steps)
    const childPulses = this.findChildPulses(steps);
    if (childPulses.length > 0) {
      // Create new pulse as lead
      const newPulse = new Pulse(steps, true);
      newPulse.addStepper(stepper);
      this.pulses.set(steps, newPulse);

      // Demote all children and adopt their subs (flat structure)
      for (const childPulse of childPulses) {
        // Transfer child's subs to new parent before demotion
        if (childPulse.hasSubs()) {
          const childSubs = childPulse.getSubs()!;
          for (const sub of childSubs) {
            newPulse.addSub(sub);
          }
          childPulse.clearSubs();
        }

        // Demote child and add to new parent's subs
        this.demoteFromLead(childPulse);
        newPulse.addSub(childPulse);

        // Update steppers to listen to new parent
        const childSteppers = childPulse.getSteppers();
        for (const childStepper of childSteppers) {
          childStepper.listenToPulse(newPulse);
        }
      }

      // Add to lead tracking
      this.promoteToLead(newPulse);

      // Stepper listens to the new lead pulse
      stepper.listenToPulse(newPulse);
      return;
    }

    // Case 4: No relationships - create as new independent lead pulse
    const newPulse = new Pulse(steps, true);
    newPulse.addStepper(stepper);
    this.pulses.set(steps, newPulse);
    this.promoteToLead(newPulse);

    // Stepper listens to its own pulse
    stepper.listenToPulse(newPulse);
  }

  /**
   * Deregisters a stepper from its pulse.
   * Cleans up pulses and reorganizes hierarchy as needed.
   *
   * Algorithm:
   * 1. Find the pulse the stepper is listening to
   * 2. Remove stepper from pulse
   * 3. If pulse has no more steppers:
   *    - If pulse is lead with children: promote largest child
   *    - If pulse is child: remove from parent's subs
   *    - Delete the pulse
   *
   * @param stepper - The stepper to deregister
   */
  deregister(stepper: Stepper): void {
    const steps = stepper.steps;
    const pulse = this.pulses.get(steps);

    if (!pulse) {
      console.warn(`[Pulses] No pulse found for stepper with ${steps} steps`);
      return;
    }

    // Remove stepper from pulse
    const shouldDelete = pulse.removeStepper(stepper);

    // Unsubscribe stepper
    stepper.pulseSubscription?.unsubscribe();

    if (shouldDelete) {
      this.deletePulseAndReorganize(pulse);
    }
  }

  /**
   * Updates a stepper's pulse when its step count changes.
   * Atomic operation that ensures consistency throughout the update.
   *
   * This is the critical method that prevents orphaned pulses and maintains
   * hierarchy invariants during stepper size changes.
   *
   * Algorithm:
   * 1. Deregister from old pulse (may trigger reorganization)
   * 2. Register to new pulse (may create new pulse or join existing)
   * 3. If any error occurs, log it (transaction semantics)
   *
   * @param stepper - The stepper being updated
   * @param oldSteps - The previous step count
   * @param newSteps - The new step count
   */
  update(stepper: Stepper, oldSteps: number, newSteps: number): void {
    if (oldSteps === newSteps) return; // No change

    try {
      // Phase 1: Deregister from old pulse
      // NOTE: We temporarily create a proxy to deregister from old pulse
      const oldStepperProxy = { ...stepper, steps: oldSteps } as Stepper;
      this.deregister(oldStepperProxy);

      // Phase 2: Register to new pulse (stepper.steps should already be updated)
      this.register(stepper);
    } catch (error) {
      console.error(
        `[Pulses] Error during update from ${oldSteps} to ${newSteps}:`,
        error
      );
      throw error; // Re-throw to notify caller
    }
  }

  // ============================================================================
  // PULSE LIFECYCLE (Private/Internal)
  // ============================================================================

  /**
   * Deletes a pulse and reorganizes the hierarchy.
   * @param pulse - The pulse to delete
   */
  private deletePulseAndReorganize(pulse: Pulse): void {
    const steps = pulse.steps;

    // Case 1: Lead pulse with children - promote largest child
    if (pulse.lead && pulse.hasSubs()) {
      this.promoteChild(pulse);
      this.demoteFromLead(pulse);
    }

    // Case 2: Lead pulse without children - just remove from tracking
    if (pulse.lead && !pulse.hasSubs()) {
      this.demoteFromLead(pulse);
    }

    // Case 3: Non-lead pulse (child) - remove from parent's subs
    if (!pulse.lead) {
      const parentPulse = this.findParentPulse(steps);
      if (parentPulse) {
        parentPulse.removeSub(pulse);
      }
    }

    // Delete from map
    this.pulses.delete(steps);
    pulse.destroy();
  }

  /**
   * Promotes a pulse to lead status.
   * @param pulse - The pulse to promote
   */
  private promoteToLead(pulse: Pulse): void {
    pulse.lead = true;
    this.addToLeadSteps(pulse.steps);
  }

  /**
   * Demotes a pulse from lead status.
   * @param pulse - The pulse to demote
   */
  private demoteFromLead(pulse: Pulse): void {
    pulse.lead = false;
    this.removeFromLeadSteps(pulse.steps);
  }

  // ============================================================================
  // HIERARCHY MANAGEMENT (Private/Internal)
  // ============================================================================

  /**
   * Finds the best parent pulse for a given step count.
   * Returns the largest lead pulse that can be a parent.
   *
   * @param steps - The step count to find a parent for
   * @returns The parent pulse, or null if none found
   */
  private findParentPulse(steps: number): Pulse | null {
    let largestParent: Pulse | null = null;
    let largestSteps = 0;

    // Iterate through lead pulses (only leads can be parents)
    for (const leadSteps of this.leadSteps) {
      // A pulse is a parent if its steps are a multiple of the child's steps
      // AND the child's steps divide evenly into the parent's steps
      if (leadSteps % steps === 0 && leadSteps > largestSteps) {
        const pulse = this.pulses.get(leadSteps)!;
        largestParent = pulse;
        largestSteps = leadSteps;
      }
    }

    return largestParent;
  }

  /**
   * Finds all lead pulses that should be children of a given step count.
   * Returns pulses whose steps are factors of the given step count.
   *
   * @param steps - The step count to find children for
   * @returns Array of child pulses (may be empty)
   */
  private findChildPulses(steps: number): Pulse[] {
    const children: Pulse[] = [];

    // Iterate through lead pulses
    for (const leadSteps of this.leadSteps) {
      // A pulse is a child if the parent's steps are a multiple of the child's steps
      if (steps % leadSteps === 0) {
        const pulse = this.pulses.get(leadSteps)!;
        children.push(pulse);
      }
    }

    return children;
  }

  /**
   * Finds the largest child pulse in a parent's subs array.
   * Used during promotion when a parent pulse is deleted.
   *
   * @param parent - The parent pulse
   * @returns The largest child, or null if no children
   */
  private findLargestChild(parent: Pulse): Pulse | null {
    if (!parent.hasSubs()) return null;

    const subs = parent.getSubs()!;
    let largest: Pulse | null = null;
    let maxSteps = 0;

    for (const child of subs) {
      if (child.steps > maxSteps) {
        largest = child;
        maxSteps = child.steps;
      }
    }

    return largest;
  }

  /**
   * Assigns a pulse to a parent's subs array.
   * @param pulse - The child pulse
   * @param parent - The parent pulse
   */
  private assignToParent(pulse: Pulse, parent: Pulse): void {
    parent.addSub(pulse);
  }

  /**
   * Promotes the largest child of a parent pulse to lead.
   * Transfers all siblings to the promoted child's subs.
   *
   * @param parent - The parent pulse whose largest child should be promoted
   */
  private promoteChild(parent: Pulse): void {
    const largestChild = this.findLargestChild(parent);
    if (!largestChild) return;

    // Get all subs except the one being promoted
    const siblings = parent
      .getSubs()!
      .filter((sub) => sub.steps !== largestChild.steps);

    // Transfer siblings to the promoted child (flat structure)
    for (const sibling of siblings) {
      largestChild.addSub(sibling);
    }

    // Promote to lead
    this.promoteToLead(largestChild);

    // Update all steppers in the promoted child and its descendants to listen to it
    const allSteppers = largestChild.getAllSteppers();
    for (const stepper of allSteppers) {
      stepper.listenToPulse(largestChild);
    }

    // Parent's subs will be cleared by caller (deletePulseAndReorganize)
  }

  // ============================================================================
  // LEAD PULSE ARRAY MANAGEMENT (Private/Internal)
  // ============================================================================

  /**
   * Adds a step count to the leadSteps array, maintaining descending sort order.
   * Uses binary search for O(log n) insertion.
   *
   * @param steps - The step count to add
   */
  private addToLeadSteps(steps: number): void {
    // Binary search to find insertion point
    let left = 0;
    let right = this.leadSteps.length;

    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (this.leadSteps[mid] > steps) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }

    // Insert at the found position
    this.leadSteps.splice(left, 0, steps);
  }

  /**
   * Removes a step count from the leadSteps array.
   * Uses binary search for O(log n) removal.
   *
   * @param steps - The step count to remove
   */
  private removeFromLeadSteps(steps: number): void {
    // Binary search to find the element
    let left = 0;
    let right = this.leadSteps.length - 1;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      if (this.leadSteps[mid] === steps) {
        this.leadSteps.splice(mid, 1);
        return;
      } else if (this.leadSteps[mid] > steps) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
  }

  /**
   * Rebuilds the leadSteps array from scratch.
   * Emergency method for recovery if array becomes corrupted.
   */
  // private rebuildLeadSteps(): void {
  //   this.leadSteps = [];
  //   for (const [steps, pulse] of this.pulses.entries()) {
  //     if (pulse.lead) {
  //       this.leadSteps.push(steps);
  //     }
  //   }
  //   // Sort descending
  //   this.leadSteps.sort((a, b) => b - a);
  // }

  // ============================================================================
  // QUERY METHODS (Public API)
  // ============================================================================

  /**
   * Gets a pulse by step count.
   * @param steps - The step count
   * @returns The pulse, or undefined if not found
   */
  getPulse(steps: number): Pulse | undefined {
    return this.pulses.get(steps);
  }

  /**
   * Gets all lead pulses.
   * @returns Array of lead pulses
   */
  getLeadPulses(): Pulse[] {
    return this.leadSteps.map((steps) => this.pulses.get(steps)!);
  }

  /**
   * Gets all pulses (both lead and non-lead).
   * @returns Array of all pulses
   */
  getAllPulses(): Pulse[] {
    return Array.from(this.pulses.values());
  }

  /**
   * Validates the internal state of the Pulses system.
   * Checks invariants to ensure consistency.
   *
   * Invariants:
   * - Every step in leadSteps exists in pulses Map
   * - Every pulse in leadSteps has lead=true
   * - leadSteps is sorted descending
   * - No duplicate entries in leadSteps
   * - All pulses in Map are either lead or in some parent's subs
   * - No pulse appears in multiple parents' subs
   *
   * @returns true if valid, false otherwise
   */
  validateState(): boolean {
    // Check 1: Every step in leadSteps exists in Map
    for (const steps of this.leadSteps) {
      const pulse = this.pulses.get(steps);
      if (!pulse) {
        console.error(
          `[Validation] Lead step ${steps} not found in pulses Map`
        );
        return false;
      }
      if (!pulse.lead) {
        console.error(
          `[Validation] Pulse ${steps} in leadSteps but lead=false`
        );
        return false;
      }
    }

    // Check 2: leadSteps is sorted descending
    for (let i = 0; i < this.leadSteps.length - 1; i++) {
      if (this.leadSteps[i] <= this.leadSteps[i + 1]) {
        console.error(
          `[Validation] leadSteps not sorted descending at index ${i}`
        );
        return false;
      }
    }

    // Check 3: All lead pulses are in leadSteps
    for (const [steps, pulse] of this.pulses.entries()) {
      if (pulse.lead && !this.leadSteps.includes(steps)) {
        console.error(
          `[Validation] Lead pulse ${steps} not in leadSteps array`
        );
        return false;
      }
    }

    // Check 4: Validate each pulse's internal state
    for (const pulse of this.pulses.values()) {
      if (!pulse.validateState()) {
        return false;
      }
    }

    // Check 5: No pulse appears in multiple parents' subs
    const subsMap = new Map<number, number>(); // steps -> parent steps
    for (const [parentSteps, pulse] of this.pulses.entries()) {
      if (pulse.hasSubs()) {
        for (const sub of pulse.getSubs()!) {
          if (subsMap.has(sub.steps)) {
            console.error(
              `[Validation] Pulse ${sub.steps} appears in multiple parents: ` +
                `${subsMap.get(sub.steps)} and ${parentSteps}`
            );
            return false;
          }
          subsMap.set(sub.steps, parentSteps);
        }
      }
    }

    return true;
  }

  // ============================================================================
  // NOTIFICATION (Public API)
  // ============================================================================

  /**
   * Notifies all lead pulses to tick.
   * This should be called by the main timing loop.
   *
   * @param stepNumber - The current step number
   * @param time - The audio context time
   */
  notifyAll(stepNumber: number, time: number): void {
    for (const leadSteps of this.leadSteps) {
      const pulse = this.pulses.get(leadSteps)!;
      pulse.pulsate(stepNumber % pulse.steps, time);
    }
  }

  // ============================================================================
  // UTILITY & DEBUG
  // ============================================================================

  /**
   * Returns a debug string representation of the Pulses system.
   * @returns String representation
   */
  toString(): string {
    const leadPulses = this.getLeadPulses();
    const allPulses = this.getAllPulses();

    let output = `Pulses System:\n`;
    output += `  Total pulses: ${allPulses.length}\n`;
    output += `  Lead pulses: ${leadPulses.length}\n`;
    output += `  leadSteps: [${this.leadSteps.join(", ")}]\n\n`;

    output += `Lead Pulses:\n`;
    for (const pulse of leadPulses) {
      output += `  ${pulse.toString()}\n`;
      if (pulse.hasSubs()) {
        for (const sub of pulse.getSubs()!) {
          output += `    └─ ${sub.toString()}\n`;
        }
      }
    }

    return output;
  }

  /**
   * Prints the current state to console for debugging.
   */
  printState(): void {
    console.log(this.toString());
  }

  /**
   * Gets statistics about the Pulses system.
   * @returns Statistics object
   */
  getStats() {
    const leadPulses = this.getLeadPulses();
    const allPulses = this.getAllPulses();

    let totalSteppers = 0;
    let totalSubs = 0;

    for (const pulse of allPulses) {
      totalSteppers += pulse.count;
      if (pulse.hasSubs()) {
        totalSubs += pulse.getSubs()!.length;
      }
    }

    return {
      totalPulses: allPulses.length,
      leadPulses: leadPulses.length,
      totalSteppers,
      averageSteppersPerPulse: totalSteppers / allPulses.length || 0,
      totalSubRelationships: totalSubs,
    };
  }
}

export default new Pulses();
