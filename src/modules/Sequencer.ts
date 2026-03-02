import Pulses from "./Pulses";
import State from "../state/State";
import { Subscription } from "rxjs";
import type { StepperIdType } from "../state/state.types";

const appLoaderElt = document.getElementById("app-loader");
const sequencer = document.getElementById("sequencer");
/** Coordinates steppers and their pulses. Phißlosophy: Keep as little pulses as possible running in the application
 based on the steppers needs */

class Sequencer {
  pulses: typeof Pulses | null = null;
  stepperBeatsUpdateSubscriptions?: Subscription[] = [];
  stepperStepsUpdateSubscriptions?: Subscription[] = [];
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

  async initSteppersFromState() {
    return Promise.all(
      State.getInitialStepperOptions().map((options) => {
        this.register(options);
      }),
    );
  }
  /** boolean allows opting out of reinitializing tracks,
   * for example in the case of loading a template */
  async reload() {
    Pulses.reset();
    await this.initSteppersFromState();
  }

  private register = async (options: {
    id: StepperIdType;
    beats: number;
    stepsPerBeat: number;
  }) => {
    const steps = options.stepsPerBeat * options.beats;
    if (steps < 1 || steps > 100) return;
    // we never recreate the track
    // it is subscribed and unsubscribed by the pulses
    const track = State.getTrack(options.id)?.instance;
    track?.init();
    if (track) this.pulses?.register(track!);
  };
}

export default Sequencer;
