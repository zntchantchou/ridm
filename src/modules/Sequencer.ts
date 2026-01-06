import Stepper, { type StepperOptions } from "../components/Stepper";
import StepperControls from "../components/StepperControls";
import SoundPanel from "../components/SoundPanel";
import Pulses from "./Pulses";
import Track from "./Track";
import State from "../state/state";
import { fromEvent, Subscription, throttleTime } from "rxjs";

const DEBOUNCE_TIME_MS = 200;
/** Coordinates steppers and their pulses. Philosophy: Keep as little pulses as possible running in the application
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
    this.setupStepperResizeEvents();
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

  private setupStepperResizeEvents() {
    this.stepperBeatsUpdateSubscriptions = this.getBeatsInputs().map((e) => {
      return fromEvent(e, "change")
        .pipe(throttleTime(DEBOUNCE_TIME_MS))
        .subscribe(this.handleBeatsUpdate);
    });

    this.stepperStepsUpdateSubscriptions = this.getStepsPerBeatInputs().map(
      (e) => {
        return fromEvent(e, "change")
          .pipe(throttleTime(DEBOUNCE_TIME_MS))
          .subscribe(this.handleStepsPerBeatUpdate);
      }
    );
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
