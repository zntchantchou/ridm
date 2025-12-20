import Stepper, { type StepperOptions } from "./Stepper";
import Pulses from "./Pulses";

/** Coordinates steppers and their pulses. Philosophy: Keep as little pulses as possible running in the application
 based on the steppers needs */
class Sequencer {
  pulses: Pulses | null = null;
  steppers: Stepper[] = [];

  constructor(pulses: Pulses) {
    this.pulses = pulses;
  }

  registerDefaults() {
    DEFAULT_STEPPERS.forEach((elt, i) => {
      this.register(new Stepper({ ...elt, id: i }));
    });
  }

  register(stepper: Stepper) {
    if (stepper.steps < 1 || stepper.steps > 100) return;
    // give number
    stepper.id = this.steppers.length;
    this.steppers.push(stepper);
    this.pulses?.register(stepper, this.steppers);
  }
  // updateStepper(stepper: Stepper) {
  //   // Should destroy the subscription
  //   // IF only stepper for pulse, should also remove the pulse
  //   console.log("[Sequencer]", stepper);
  // }

  // updatePulse(steps: number) {
  //   console.log("[Sequencer] RemovePulse ", steps);
  //   // Should destroy the subscription
  //   // IF only stepper for pulse, should also remove the pulse
  // }
  // removeStepper(stepper: Stepper) {
  //   // Should destroy the subscription
  //   // IF only stepper for pulse, should also remove the pulse
  //   console.log("[Sequencer]", stepper);
  // }

  // removePulse(steps: number) {
  //   console.log("[Sequencer] RemovePulse ", steps);
  //   // Should destroy the subscription
  //   // IF only stepper for pulse, should also remove the pulse
  // }
}

export default Sequencer;

const DEFAULT_STEPPER = { beats: 4, stepsPerBeat: 4 };
const DEFAULT_STEPPERS: StepperOptions[] = Array(8).fill(DEFAULT_STEPPER);
