import Stepper, { type StepperOptions } from "../components/Stepper";
import StepperControls from "../components/StepperControls";
import SoundPanel from "../components/SoundPanel";
import Pulses from "./Pulses";
import Track from "./Track";
import State from "../state/state";
import { Subscription } from "rxjs";

/** Coordinates steppers and their pulses. Phißlosophy: Keep as little pulses as possible running in the application
 based on the steppers needs */

class Sequencer {
  pulses: typeof Pulses | null = null;
  steppers: Stepper[] = [];
  controls: StepperControls[] = [];
  stepperBeatsUpdateSubscriptions?: Subscription[] = [];
  stepperStepsUpdateSubscriptions?: Subscription[] = [];

  // value is the parameters to be set on the effect (ToneAudioNode)
  constructor(pulses: typeof Pulses) {
    this.pulses = pulses;
  }

  async initialize() {
    await this.initSteppersFromState();
    new SoundPanel({
      steppers: this.steppers,
    });
  }

  private async initSteppersFromState() {
    return Promise.all(State.getInitialStepperOptions().map(this.register));
  }

  private register = async (options: StepperOptions) => {
    const steps = options.stepsPerBeat * options.beats;
    if (steps < 1 || steps > 100) return;

    const stepperControls = new StepperControls({
      stepperId: options.id,
      beats: options.beats,
      stepsPerBeats: options.stepsPerBeat,
      name: options.sampleName,
      color: options.color.cssColor,
    });

    const stepperTrack = new Track({
      name: options.sampleName,
      stepperId: options.id.toString(),
    });

    const stepper = new Stepper({
      ...options,
      controls: stepperControls,
      color: options.color,
      sampleName: options.sampleName,
      track: stepperTrack,
    });

    await stepperTrack.init();

    this.steppers.push(stepper);
    this.pulses?.register(stepper);
    this.controls.push(stepperControls);
  };

  getStepper(id: number) {
    return this.steppers.find((s) => s.id === id);
  }
}

export default Sequencer;
