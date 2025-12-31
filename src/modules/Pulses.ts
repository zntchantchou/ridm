import Stepper from "../components/Stepper";
import Pulse from "./Pulse";

class Pulses {
  /** Map of all pulses, indexed by step count for O(1) lookup */
  private pulses: Map<number, Pulse>;

  /** Sorted array of lead pulse step counts (descending order) */
  private leadSteps: number[];

  constructor() {
    this.pulses = new Map();
    this.leadSteps = [];
  }

  /**
   * Registers a stepper to the appropriate pulse.
   * Creates pulses and manages hierarchy as needed.
   */
  register(stepper: Stepper): void {
    const steps = stepper.steps;

    // Case 1: Lead pulse already exists - just add stepper to it
    const existingPulse = this.pulses.get(steps);
    if (existingPulse && existingPulse.lead) {
      existingPulse.addStepper(stepper);
      stepper.listenToPulse(existingPulse);
      return;
    }

    // Case 2: Find parent pulse (a lead pulse whose steps are a multiple of this stepper's steps)
    const parentPulse = this.findParentPulse(steps);
    if (parentPulse) {
      const newPulse = new Pulse(steps, false);
      newPulse.addStepper(stepper);
      this.pulses.set(steps, newPulse);
      this.assignToParent(newPulse, parentPulse);
      stepper.listenToPulse(parentPulse);
      return;
    }
    // Case 3: Find child pulses (lead pulses whose steps are factors of this stepper's steps)
    const childPulses = this.findChildrenPulses(steps);
    if (childPulses.length > 0) {
      const newPulse = new Pulse(steps, true);
      newPulse.addStepper(stepper);
      this.pulses.set(steps, newPulse);

      // Demote all children and adopt their subs (flat structure)
      for (const childPulse of childPulses) {
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
    stepper.listenToPulse(newPulse);
  }

  /**
   * Deregisters a stepper from its pulse.
   * Cleans up pulses and reorganizes hierarchy as needed.
   */
  deregister(stepper: Stepper): void {
    const steps = stepper.steps;
    const pulse = this.pulses.get(steps);

    if (!pulse) {
      console.warn(`[Pulses] No pulse found for stepper with ${steps} steps`);
      return;
    }
    console.log("[PULSES] DEREGISTER");
    const shouldDelete = pulse.removeStepper(stepper);
    stepper.pulseSubscription?.unsubscribe();

    if (shouldDelete) {
      this.deletePulseAndReorganize(pulse);
    }
  }

  /**
   * Updates a stepper's pulse when its step count changes.
   */
  update(stepper: Stepper, oldSteps: number, newSteps: number): void {
    if (oldSteps === newSteps) return; // No change

    try {
      // Phase 1: Deregister from old pulse
      const oldStepper = { ...stepper, steps: oldSteps };
      this.deregister(oldStepper as Stepper);

      // Phase 2: Register to new pulse (stepper.steps should already be updated)
      console.log("[PULSES REGISTER]", stepper);
      this.register(stepper);
    } catch (error) {
      console.error(
        `[Pulses] Error during update from ${oldSteps} to ${newSteps}:`,
        error
      );
      throw error; // Re-throw to notify caller
    }
  }

  /**
   * Deletes a pulse and reorganizes the hierarchy.
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
   */
  private promoteToLead(pulse: Pulse): void {
    pulse.lead = true;
    this.addToLeadSteps(pulse.steps);
  }

  /**
   * Demotes a pulse from lead status.
   */
  private demoteFromLead(pulse: Pulse): void {
    pulse.lead = false;
    this.removeFromLeadSteps(pulse.steps);
  }

  /**
   * Returns the largest lead pulse that can be a parent.
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
   * Returns pulses whose steps are factors of the given step count.
   */
  private findChildrenPulses(steps: number): Pulse[] {
    const children: Pulse[] = [];

    for (const leadSteps of this.leadSteps) {
      if (steps % leadSteps === 0) {
        const pulse = this.pulses.get(leadSteps)!;
        children.push(pulse);
      }
    }

    return children;
  }

  /**
   * Finds the largest child pulse in a parent's subs array.
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
   */
  private assignToParent(pulse: Pulse, parent: Pulse): void {
    parent.addSub(pulse);
  }

  /**
   * Promotes the largest child of a parent pulse to lead.
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
  }

  /**
   * Adds a step count to the leadSteps array, maintaining descending sort order.
   * Uses binary search insertion.
   */
  private addToLeadSteps(steps: number): void {
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

  /** Removes a step count from the leadSteps array. */
  private removeFromLeadSteps(steps: number): void {
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
   * Gets a pulse by step count.
   */
  getPulse(steps: number): Pulse | undefined {
    return this.pulses.get(steps);
  }

  /**
   * Gets all lead pulses.
   */
  getLeadPulses(): Pulse[] {
    return this.leadSteps.map((steps) => this.pulses.get(steps)!);
  }

  /**
   * Gets all pulses (both lead and non-lead).
   */
  getAllPulses(): Pulse[] {
    return Array.from(this.pulses.values());
  }

  /**
   * Notifies all lead pulses to tick.
   */
  notifyAll(stepNumber: number, time: number): void {
    for (const leadSteps of this.leadSteps) {
      const pulse = this.pulses.get(leadSteps)!;
      pulse.pulsate(stepNumber % pulse.steps, time);
    }
  }

  /**
   * Returns a debug string representation of the Pulses system.
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
