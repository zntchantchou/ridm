import Stepper, { type StepperOptions } from "./Stepper";
import Pulses from "./Pulses";
import Controls from "./Controls";
import { SAMPLES_DIRS } from "./Audio";
import StepperControls from "./StepperControls";

/** Coordinates steppers and their pulses. Philosophy: Keep as little pulses as possible running in the application
 based on the steppers needs */
class Sequencer {
  pulses: typeof Pulses | null = null;
  steppers: Stepper[] = [];
  controls: StepperControls[] = [];

  constructor(pulses: typeof Pulses) {
    this.pulses = pulses;
  }

  registerDefaults() {
    DEFAULT_STEPPERS.forEach((elt, i) => {
      this.register({ ...elt, id: i, sampleName: SAMPLES_DIRS[i].name });
    });
    Controls.getBeatsInputs().forEach((e) => {
      e.addEventListener("change", this.handleBeatsUpdate);
    });
    Controls.getStepsPerBeatInputs().forEach((e) => {
      e.addEventListener("change", this.handleStepsPerBeatUpdate);
    });
  }

  register(options: StepperOptions) {
    const steps = options.stepsPerBeat * options.beats;
    if (steps < 1 || steps > 100) return;

    const stepper = new Stepper(options);

    const stepperControls = new StepperControls({
      stepperId: options.id,
      beats: options.beats,
      stepsPerBeats: options.stepsPerBeat,
      name: options.sampleName,
    });
    // give number
    stepper.id = this.steppers.length;
    this.steppers.push(stepper);
    this.pulses?.register(stepper);
    this.controls.push(stepperControls);
  }
  handleStepperUpdate = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const value = parseInt(target.value);
    const stepper = this.getStepper(
      parseInt(target.dataset.stepperId as string)
    );
    return { value, stepper };
  };

  handleBeatsUpdate = (e: Event) => {
    const { value, stepper } = this.handleStepperUpdate(e);
    if (!stepper) return;
    stepper.updateSteps({ beats: value });
  };

  handleStepsPerBeatUpdate = (e: Event) => {
    const { value, stepper } = this.handleStepperUpdate(e);
    if (!stepper) return;
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
