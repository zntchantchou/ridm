import Stepper, { type StepperOptions } from "./Stepper.integration";
import Pulses from "./integration/Pulses";
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
    this.pulses?.register(stepper);
  }

  handleBeatsUpdate = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const value = parseInt(target.value);
    if (!target.dataset.stepperId) return;
    const stepper = this.getStepper(parseInt(target.dataset.stepperId));
    if (!stepper) return;
    this.pulses?.update(stepper, stepper.steps, value);
    // stepper.updateBeats(value);
    stepper.updateSteps({ beats: value });
  };

  handleStepsPerBeatUpdate = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const value = parseInt(target.value);
    if (!target.dataset.stepperId) return;
    const stepper = this.getStepper(parseInt(target.dataset.stepperId));
    if (!stepper) return;
    this.pulses?.update(stepper, stepper.steps, value);
    // stepper?.updateStepsPerBeat(value);
    stepper.updateSteps({ stepsPerBeat: value });
  };

  getStepper(id: number) {
    return this.steppers.find((s) => s.id === id);
  }
}

export default Sequencer;

const DEFAULT_STEPPER = { beats: 4, stepsPerBeat: 4 };
// const DEBUG_STEPPERS = [
//   {
//     beats: 4,
//     stepsPerBeat: 4,
//     id: 0,
//     sampleName: "hh",
//   },
//   {
//     beats: 4,
//     stepsPerBeat: 2,
//     id: 1,
//     sampleName: "sd",
//   },
//   {
//     beats: 4,
//     stepsPerBeat: 1,
//     id: 2,
//     sampleName: "lt",
//   },
// ];
const DEFAULT_STEPPERS: StepperOptions[] = Array(8).fill(DEFAULT_STEPPER);
