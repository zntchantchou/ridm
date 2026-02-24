import Stepper, { type StepperOptions } from "../components/Stepper";
import SoundPanel from "../components/SoundPanel";
import Pulses from "./Pulses";
import State from "../state/State";
import { Subscription } from "rxjs";

const appLoaderElt = document.getElementById("app-loader");
const sequencer = document.getElementById("sequencer");
/** Coordinates steppers and their pulses. Phißlosophy: Keep as little pulses as possible running in the application
 based on the steppers needs */

class Sequencer {
  pulses: typeof Pulses | null = null;
  steppers: Stepper[] = [];
  stepperBeatsUpdateSubscriptions?: Subscription[] = [];
  stepperStepsUpdateSubscriptions?: Subscription[] = [];
  soundPanel?: SoundPanel;
  // value is the parameters to be set on the effect (ToneAudioNode)
  constructor(pulses: typeof Pulses) {
    this.pulses = pulses;
  }

  async initialize() {
    await this.initSteppersFromState();
    appLoaderElt!.style.display = "none";
    sequencer!.style.visibility = "visible";
    sequencer!.style.display = "block";
  }

  async initSteppersFromState(initializeTracks: boolean = true) {
    return Promise.all(
      State.getInitialStepperOptions().map((options) => {
        this.register(options, initializeTracks);
      }),
    );
  }
  /** boolean allows opting out of reinitializing tracks,
   * for example in the case of loading a template */
  async reload(initializeTracks: boolean = true) {
    Pulses.reset();
    await this.initSteppersFromState(initializeTracks);
  }

  private register = async (
    options: StepperOptions,
    initializeTracks: boolean = true,
  ) => {
    const steps = options.stepsPerBeat * options.beats;
    if (steps < 1 || steps > 100) return;
    // we never recreate the track
    // it is subscribed and unsubscribed by the pulses
    const track = State.getTrack(options.id)?.instance;
    if (initializeTracks) track?.init();
    if (track) this.pulses?.register(track!);
  };
}

export default Sequencer;
