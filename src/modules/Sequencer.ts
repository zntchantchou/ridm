import Stepper, { type StepperOptions } from "../components/Stepper";
import StepperControls from "../components/StepperControls";
import SoundPanel from "../components/SoundPanel";
import Pulses from "./Pulses";
import Track from "./Track";
import State from "../state/State";
import { Subscription } from "rxjs";

const appLoaderElt = document.getElementById("app-loader");
const sequencer = document.getElementById("sequencer");
/** Coordinates steppers and their pulses. Phißlosophy: Keep as little pulses as possible running in the application
 based on the steppers needs */

class Sequencer {
  pulses: typeof Pulses | null = null;
  steppers: Stepper[] = [];
  controls: StepperControls[] = [];
  stepperBeatsUpdateSubscriptions?: Subscription[] = [];
  stepperStepsUpdateSubscriptions?: Subscription[] = [];
  soundPanel?: SoundPanel;
  // value is the parameters to be set on the effect (ToneAudioNode)
  constructor(pulses: typeof Pulses) {
    this.pulses = pulses;
  }

  async initialize() {
    await this.initSteppersFromState();
    this.soundPanel = new SoundPanel({
      steppers: this.steppers,
    });
    appLoaderElt!.style.display = "none";
    sequencer!.style.visibility = "visible";
    sequencer!.style.display = "block";
  }

  async initSteppersFromState(createTrack: boolean = true) {
    return Promise.all(
      State.getInitialStepperOptions().map((options) =>
        this.register(options, createTrack),
      ),
    );
  }

  async reload() {
    const tracks = this.steppers.map((s) => s.track);
    this.steppers = [];
    this.controls = [];
    Pulses.reset();
    await this.initSteppersFromState(false);
    // pass the old tracks to the new steppers, avoids creating audioNodes or loading buffers each time we load a template
    for (const [index, stepper] of this.steppers.entries()) {
      stepper.track = tracks[index];
    }
    this.soundPanel?.initializeEvents();
    this.soundPanel?.updateSteppers(this.steppers);
  }

  async reloadEffects() {}

  restart() {
    // recreate a track with the current audio Context for each stepper
    State.getInitialStepperOptions().forEach(async (options, i) => {
      const track = new Track({
        name: options.sampleName,
        stepperId: options.id.toString(),
      });
      track.init();
      this.steppers[i].track = track;
    });
  }

  private register = async (
    options: StepperOptions,
    createTrack: boolean = true,
  ) => {
    const steps = options.stepsPerBeat * options.beats;
    if (steps < 1 || steps > 100) return;

    const stepperControls = new StepperControls({
      stepperId: options.id,
      beats: options.beats,
      stepsPerBeats: options.stepsPerBeat,
      name: options.sampleName,
      color: options.color.cssColor,
    });
    const stepper = new Stepper({
      ...options,
      controls: stepperControls,
      color: options.color,
      sampleName: options.sampleName,
    });
    if (createTrack) {
      const stepperTrack = new Track({
        name: options.sampleName,
        stepperId: options.id.toString(),
      });
      stepper.track = stepperTrack;
      await stepperTrack.init();
    }

    this.steppers.push(stepper);
    this.pulses?.register(stepper);
    this.controls.push(stepperControls);
  };

  getStepper(id: number) {
    return this.steppers.find((s) => s.id === id);
  }
}

export default Sequencer;
