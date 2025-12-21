import Stepper, { type StepperOptions } from "./Stepper";
import Pulses from "./Pulses";
import Controls from "./Controls";
import { SAMPLES_DIRS } from "./Audio";

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
      this.register(
        new Stepper({ ...elt, id: i, sampleName: SAMPLES_DIRS[i].name })
      );
    });
    Controls.getBeatsInputs().forEach((e) => {
      e.addEventListener("change", this.handleBeatsUpdate);
    });
    Controls.getStepsPerBeatInputs().forEach((e) => {
      e.addEventListener("change", this.handleStepsPerBeatUpdate);
    });
  }

  register(stepper: Stepper) {
    if (stepper.steps < 1 || stepper.steps > 100) return;
    // give number
    stepper.id = this.steppers.length;
    this.steppers.push(stepper);
    this.pulses?.register(stepper, this.steppers);
  }

  handleBeatsUpdate = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const value = parseInt(target.value);
    if (!target.dataset.stepperId) return;
    const stepper = this.getStepper(parseInt(target.dataset.stepperId));
    if (!stepper) return;
    this.pulses?.deregister(stepper); // ORDER MATTERS, DEREGISTER BEFORE UPDATING...
    stepper.updateBeats(value);
    this.pulses?.register(stepper, this.steppers);
    // console.log("AFTER HANDLE BEATS UPDATE ", this.pulses);
  };

  handleStepsPerBeatUpdate = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const value = parseInt(target.value);
    if (!target.dataset.stepperId) return;
    const stepper = this.getStepper(parseInt(target.dataset.stepperId));
    if (!stepper) return;
    this.pulses?.deregister(stepper); // delete from pulses if necessary
    stepper?.updateStepsPerBeat(value);
    this.pulses?.register(stepper, this.steppers);
    // console.log("AFTER HANDLE STEPS PER BEAT UPDATE ", this.pulses);
  };

  getStepper(id: number) {
    return this.steppers.find((s) => s.id === id);
  }
}

export default Sequencer;

const DEFAULT_STEPPER = { beats: 4, stepsPerBeat: 4 };

const DEFAULT_STEPPERS: StepperOptions[] = Array(8).fill(DEFAULT_STEPPER);
