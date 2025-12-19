import Stepper from "./Stepper";
import Pulses from "./Pulses";
class Sequencer {
  pulses: Pulses | null = null;
  steppers: Stepper[] = [];

  constructor(pulses: Pulses) {
    this.pulses = pulses;
  }
  register(stepper: Stepper) {
    if (stepper.steps < 1 || stepper.steps > 100) return;
    this.steppers.push(stepper);
    this.pulses?.register(stepper, this.steppers);
  }

  removeStepper(stepper: Stepper) {
    console.log("[Sequencer]", stepper);
  }
}

export default Sequencer;
