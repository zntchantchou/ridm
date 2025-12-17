import Stepper from "./Stepper";
import type { BeatMapType } from "./types";
import Pulses from "./Pulses";
class Sequencer {
  steppers: Stepper[] = [];
  // The only reason we are using this is because we need to update the css in updateUI by division to look for subdivision.
  // This will now be solved using subPulses instead of calculating them each render
  // A subpulse is created when a new stepper has a subdivision of the steps of an existing stepper.
  // if the subPulse already exists, update its count
  steppersMap: BeatMapType = new Map<string, { steppers: Stepper[] }>();
  register(stepper: Stepper) {
    this.steppers.push(stepper);
    Pulses.register(stepper);
    const existingBeat = this.steppersMap.get(stepper.steps.toString());
    if (!existingBeat) {
      this.steppersMap.set(stepper.steps.toString(), {
        steppers: [stepper],
      });
      return;
    }
    this.steppersMap.set(stepper.steps.toString(), {
      steppers: [...existingBeat.steppers, stepper],
    });
    // console.log("steppersMap ", this.steppersMap);
    return;
  }

  removeStepper(stepper: Stepper) {
    console.log("[Sequencer]", stepper);
  }
}

export default new Sequencer();
