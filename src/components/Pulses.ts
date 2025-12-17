import Pulse from "./Pulse";
import type Stepper from "./Stepper";

class Pulses {
  private elements: Pulse[] = [];
  // keep those from fastest pulse to slowest pulse
  private leadPulses: Pulse[] = [];

  register(stepper: Stepper) {
    // if no elements add the new pulse
    console.log("Pulses [register] ");

    if (this.isEmpty) {
      this.addLead(new Pulse({ steps: stepper.steps }));
      return;
    }
    // if already present only update the count for the existing pulse inside elements
    const existing = this.getPulse(stepper.steps);
    if (existing) {
      console.log("Existing: ", existing);
      existing.increment();
      return;
    }
    const parent = this.findParent(stepper.steps);
    if (parent) {
      const newPulse = new Pulse({ steps: stepper.steps });
      parent.addSub(newPulse);
      console.log("Parent : ", parent);
    }
    // debugger;
    // check if child
    // check if parent
    // if new pulse is neither duplicate, child, or parent,just create as a standard pulse without any subs
  }

  findParent(steps: number): Pulse | null {
    let parentPulse: Pulse | null = null;
    for (const [index, pulse] of this.leadPulses.entries()) {
      if (steps >= pulse.steps) {
        continue;
      }
      if (pulse.steps % steps === 0) {
        console.log(
          "FOUND A CHILD RYTHM: lead: ",
          pulse.steps,
          " new: ",
          steps
        );
        parentPulse = pulse;
        break;
      }
    }
    return parentPulse;
  }

  addLead(newPulse: Pulse, prevPulse?: Pulse) {
    newPulse.promote();
    if (prevPulse) prevPulse.demote();
    this.leadPulses.push(newPulse);
    this.elements.push(newPulse);
  }

  // add deregister stepper
  deregister(stepper: Stepper) {}

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

    // isParentPulse(steps: number): boolean {
    //   // for (const lead of  {
    //   //   if(steps < lead.steps)
    //   // }
    // }

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
  }

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

export default new Pulses();
