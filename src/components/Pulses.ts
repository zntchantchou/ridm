import Pulse from "./Pulse";
import type Stepper from "./Stepper";

class Pulses {
  private elements: Pulse[] = [];
  // keep those from fastest pulse to slowest pulse
  private leadPulses: Pulse[] = [];

  register(stepper: Stepper, steppers: Stepper[]) {
    if (this.isEmpty) {
      // if no elements add the new pulse
      // console.log("EMPTY STEPPER ", this);
      // OBS: the STEPPER should subscribe to the existing pulse
      const pulse = new Pulse({ steps: stepper.steps });
      stepper.listenToPulse(pulse);
      this.addLead(pulse);
      return;
    }

    const existing = this.getPulse(stepper.steps);
    if (existing) {
      // console.log("existing ", existing);
      stepper.listenToPulse(existing);
      existing.increment(); // if already present only update the count for the existing pulse inside elements
      // OBS: the STEPPER should subscribe to the existing pulse
      return;
    }

    const parent = this.findParent(stepper.steps);
    if (parent) {
      // console.log("Parent Pulse found : ", parent.steps);
      // OBS: the STEPPER should subscribe to the parent pulse
      const newPulse = new Pulse({ steps: stepper.steps });
      stepper.listenToPulse(parent);
      this.add(newPulse);
      parent.addSub(newPulse);
      return;
    }

    const child = this.findChild(stepper.steps);
    if (child) {
      console.log("Child found : ", stepper);
      const newPulse = new Pulse({ steps: stepper.steps });
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
    // OBS: the stepper must subscribe to the pulse
    const newPulse = new Pulse({ steps: stepper.steps });
    this.addLead(newPulse);
    stepper.listenToPulse(newPulse);
  }

  log() {
    // console.log("[PULSES]:elements  ", this.elements);
    // console.log("[PULSES]:leads  ", this.leadPulses);
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
    this.elements.push(newPulse);
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

  // add deregister stepper
  // deregister(stepper: Stepper) {}

  add(p: Pulse) {
    this.elements.push(p);
  }

  private has(steps: number): boolean {
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
  // is triggered by stepper registration
  // TEST:
  // ups the count if the corresponding pulse exists and does nothing else
  // if new pulse is bigger than lead
  // Checks if parent
  // if parent, stores pulse as new lead
  // adds all subs from previous lead to new lead, and clears the old lead
  // Check if child
  // create a non lead pulse
  // add to parents subs
  // if neither parent or child, create a lead pulse for this stepper

  // Create a Pulse structure so that pulse rearranges assigns a lead property to
  // ☐ rearrange the chain of pulse dependencies (ie 32, 14)
  //   -  64 => 32, 16, 8, 4
  //   -  becomes: 64, 16, 8, 4
  //   -  4 => 32, 16, 8,
  //   -  becomes 32, 16, 8, 4
  //   - Pulses is a LINEAR, SORTED Data structure (DESC ORDER)
  //   - Lead pulse is the highest pulse
  //   - A pulse becomes lead if it is such that pulse.steps % pulses.lead.steps === 0
}

export default Pulses;
