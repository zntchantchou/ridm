import Stepper from "./Stepper";
import Pulses from "./Pulses";
class Sequencer {
  // The only reason we are using this is because we need to update the css in updateUI by division to look for subdivision.
  // This will now be solved using subPulses instead of calculating them each render
  // A subpulse is created when a new stepper has a subdivision of the steps of an existing stepper.
  // if the subPulse already exists, update its count
  pulses: Pulses | null = null;
  steppers: Stepper[] = [];
  constructor(pulses: Pulses) {
    this.pulses = pulses;
  }
  register(stepper: Stepper) {
    if (stepper.steps < 1 || stepper.steps > 100) {
      console.log("CANNOT register stepper with size: ", stepper.steps);
      return;
    }
    this.steppers.push(stepper);
    this.pulses?.register(stepper);
    // console.log("PULSES IN SEQ ", this.pulses, stepper);
    return;
  }

  removeStepper(stepper: Stepper) {
    console.log("[Sequencer]", stepper);
  }
}

export default Sequencer;
