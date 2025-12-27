import Stepper, { type StepperColorType, type StepperOptions } from "./Stepper";
import Pulses from "./Pulses";
import Audio, { SAMPLES_DIRS } from "./Audio";
import StepperControls from "./StepperControls";
import SoundPanel from "./SoundPanel";

/** Coordinates steppers and their pulses. Philosophy: Keep as little pulses as possible running in the application
 based on the steppers needs */
class Sequencer {
  pulses: typeof Pulses | null = null;
  steppers: Stepper[] = [];
  controls: StepperControls[] = [];

  constructor(pulses: typeof Pulses) {
    this.pulses = pulses;
  }

  initialize() {
    this.registerDefaults();
    this.setupStepperResizeEvents();
    new SoundPanel({ steppers: this.steppers });
  }

  private registerDefaults() {
    DEFAULT_STEPPERS.forEach((elt, i) => {
      this.register({
        ...elt,
        id: i,
        sampleName: SAMPLES_DIRS[i].name,
        color: COLORS[i],
      });
    });
  }

  private register(options: StepperOptions) {
    const steps = options.stepsPerBeat * options.beats;
    if (steps < 1 || steps > 100) return;

    const stepperControls = new StepperControls({
      stepperId: options.id,
      beats: options.beats,
      stepsPerBeats: options.stepsPerBeat,
      name: options.sampleName,
    });
    const stepper = new Stepper({
      ...options,
      id: this.steppers.length,
      controls: stepperControls,
      color: options.color,
      soundSettings: Audio.defaultSoundSettings(),
    });

    this.steppers.push(stepper);
    this.pulses?.register(stepper);
    this.controls.push(stepperControls);
  }

  private setupStepperResizeEvents() {
    this.getBeatsInputs().forEach((e) => {
      e.addEventListener("change", this.handleBeatsUpdate);
    });
    this.getStepsPerBeatInputs().forEach((e) => {
      e.addEventListener("change", this.handleStepsPerBeatUpdate);
    });
  }

  private handleStepperUpdate = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const value = parseInt(target.value);
    const stepper = this.getStepper(
      parseInt(target.dataset.stepperId as string)
    );
    return { value, stepper };
  };

  private handleBeatsUpdate = (e: Event) => {
    const { value, stepper } = this.handleStepperUpdate(e);
    if (!stepper) return;
    stepper.updateSteps({ beats: value });
  };

  private handleStepsPerBeatUpdate = (e: Event) => {
    const { value, stepper } = this.handleStepperUpdate(e);
    if (!stepper) return;
    stepper.updateSteps({ stepsPerBeat: value });
  };

  getStepper(id: number) {
    return this.steppers.find((s) => s.id === id);
  }

  private getBeatsInputs() {
    return Array.from(
      document.querySelectorAll(`input[name=beats]`)
    ) as HTMLInputElement[];
  }

  private getStepsPerBeatInputs() {
    return Array.from(
      document.querySelectorAll(`input[name=steps-per-beat]`)
    ) as HTMLInputElement[];
  }
}

export default Sequencer;

const DEFAULT_STEPPER = { beats: 4, stepsPerBeat: 4 };
const COLORS: StepperColorType[] = [
  {
    name: "blue",
    cssColor: "#00d0ff",
  },
  {
    name: "purple",
    cssColor: "#9c37fb",
  },
  {
    name: "yellow",
    cssColor: "#eeff04",
  },
  {
    name: "green",
    cssColor: "#2eff04",
  },
  {
    name: "pink",
    cssColor: "#ff0ae6",
  },
  {
    name: "orange",
    cssColor: "#ff9204",
  },
  {
    name: "palePink",
    cssColor: "#feaaff",
  },

  {
    name: "red",
    cssColor: "#ff2929",
  },
];
const DEFAULT_STEPPERS: StepperOptions[] = Array(8).fill(DEFAULT_STEPPER);
