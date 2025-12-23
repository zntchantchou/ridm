import Pulse from "./Pulse";
import type Stepper from "./Stepper";

class Pulses {
  private elements: Pulse[] = [];
  // keep those from fastest pulse to slowest pulse
  private leadPulses: Pulse[] = [];

  register(stepper: Stepper, steppers: Stepper[]) {
    if (this.isEmpty) {
      // if no elements add the new pulse
      const pulse = new Pulse({ steps: stepper.steps });
      stepper.listenToPulse(pulse);
      this.addLead(pulse);
      return;
    }

    const existing = this.getPulse(stepper.steps);
    if (existing) {
      stepper.listenToPulse(existing);
      existing.increment(); // if already present only update the count for the existing pulse inside elements
      return;
    }

    const parent = this.findParent(stepper.steps);
    if (parent) {
      console.log("STEPPER FOUND PARENT s => \n", stepper);
      console.log("STEPPER FOUND PARENT p => \n", parent);
      const newPulse = new Pulse({ steps: stepper.steps });
      stepper.listenToPulse(parent);
      this.add(newPulse);
      parent.addSub(newPulse);
      return;
    }

    const child = this.findChild(stepper.steps);
    if (child) {
      const newPulse = new Pulse({ steps: stepper.steps });
      console.log("STEPPER FOUND CHILD s => ", stepper);
      console.log("STEPPER FOUND CHILD c => ", child);
      this.addLead(newPulse);
      stepper.listenToPulse(newPulse);
      if (!child.empty) {
        child.subs.forEach((s) => {
          newPulse.addSub(s);
        });
      }
      this.demote(child); // this deletes the children so the order matters
      newPulse.addSub(child);
      newPulse.subs
        // There can be multiple steppers per pulse so we have a 2D array...
        .flatMap((sub) =>
          steppers.filter((stepper) => stepper.steps === sub.steps)
        )
        .forEach((stepper) => stepper.listenToPulse(newPulse));
      // We get all subs, find their stepper and subscribe to the pulse
      return;
    }
    // pulse is neither a factor nor a subdivision of a pulse and is not currently registered
    const newPulse = new Pulse({ steps: stepper.steps });
    this.addLead(newPulse);
    stepper.listenToPulse(newPulse);
  }

  deregister(stepper: Stepper) {
    console.log("PULSES DEREGISTER ");
    stepper.stop();
    const existingPulse = this.elements.find((e) => e.steps === stepper.steps);
    if (!existingPulse) throw Error("No pulse found to deregister");
    // Promote the successor lead sub and transfer it its parent's subs
    if (existingPulse?.subs.length && existingPulse.count === 1) {
      const subs = [...existingPulse.subs];
      const successorPulse = subs[0];
      this.addLead(successorPulse);
      if (subs.length > 1) {
        subs.splice(0, 1);
        for (const sub of subs) {
          successorPulse.addSub(sub);
        }
      }
    }
    // Eliminate the updated sub if is has no stepper listening to it
    existingPulse.decrement();
    if (existingPulse.count === 0) {
      const filterFn = (p: Pulse) => p.steps !== stepper.steps;
      this.elements = this.elements.filter(filterFn);
      if (existingPulse.lead) {
        this.leadPulses = this.leadPulses.filter(filterFn);
      }
    }
  }

  findParent(steps: number): Pulse | null {
    let parentPulse: Pulse | null = null;
    for (const pulse of this.leadPulses) {
      if (steps >= pulse.steps) continue;
      if (pulse.steps % steps === 0) {
        parentPulse = pulse;
        break;
      }
    }
    return parentPulse;
  }

  findChild(steps: number) {
    let childPulse: Pulse | null = null;
    for (const pulse of [...this.leadPulses].reverse()) {
      if (steps <= pulse.steps) continue;
      if (steps % pulse.steps === 0) {
        childPulse = pulse;
      }
    }
    return childPulse;
  }

  getSteppers(
    numberOfSteps: number,
    steppers: Stepper[]
  ): Stepper[] | undefined {
    if (!steppers.length) return undefined;
    return steppers.filter((s) => s.steps === numberOfSteps);
  }
  // addLead should always sort lead by step
  addLead(newPulse: Pulse, prevPulse?: Pulse) {
    newPulse.promote();
    if (prevPulse) this.demote(prevPulse);
    this.leadPulses.push(newPulse);
    this.add(newPulse);
    this.sort();
    // addLead should always keep sorted
  }

  sort() {
    this.leadPulses = this.leadPulses.sort((a: Pulse, b: Pulse) =>
      a.steps > b.steps ? -1 : 1
    );
    return this.leadPulses;
  }
  /** remove from lead pulses and applies demote */
  demote(pulse: Pulse) {
    this.leadPulses = this.leadPulses.filter((p) => p.steps !== pulse.steps);
    pulse.demote();
  }

  add(p: Pulse) {
    if (!this.elements.find((elt) => elt.steps === p.steps))
      this.elements.push(p);
  }

  has(steps: number): boolean {
    return this.elements.some((e) => e.steps === steps);
  }

  private getPulse(steps: number): Pulse | undefined {
    return this.elements.find((e) => e.steps === steps);
  }

  get size() {
    return this.elements.length;
  }

  get isEmpty() {
    return this.elements.length === 0;
  }

  hasLeads() {
    return this.leadPulses.length !== 0;
  }

  getElements() {
    return this.elements;
  }

  getLeadPulses() {
    return this.leadPulses;
  }
}

export default Pulses;
