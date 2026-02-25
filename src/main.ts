import Controls from "./modules/Controls";
import Timerworker from "./modules/Timerworker";
import Sequencer from "./modules/Sequencer";
import Audio from "./modules/Audio";
import Pulses from "./modules/Pulses";
import UI from "./modules/Ui";
import * as Tone from "tone";
import "./state/State";
import State from "./state/State";
import StepQueue from "./modules/StepQueue";
import type { TemplateName } from "./state/state.types";

const sequencerElt = document.getElementById("sequencer");

class Application {
  initialized = false;
  timeWorker: Timerworker;
  ui: UI;
  sequencer?: Sequencer;

  constructor() {
    Audio.init();
    window.addEventListener("load", this.init);
    window.addEventListener("keydown", this.handleSpacePress);
    this.ui = new UI(Audio.getContext() as Tone.Context, Pulses);
    this.timeWorker = new Timerworker({
      pulses: Pulses,
      audioContext: Audio.getContext() as Tone.Context,
    });
  }

  init = async () => {
    Controls.init();
    this.sequencer = new Sequencer(Pulses);
    await this.sequencer.initialize();
    State.tpcUpdateSubject.subscribe(() => this.restart());
    State.currentStepperIdSubject.subscribe(() => {
      const color = State.getSelectedStepperOptions()?.color;
      const boxShadow = `0 0 30px 1px ${color?.cssColor}80`;
      console.log("BOX SHADOW ", boxShadow);
      sequencerElt!.style.boxShadow = boxShadow;
    });
    State.currentStepperIdSubject.next(State.getSelectedStepperId());
  };

  async loadTemplate(name: TemplateName) {
    const wasPaused = !Controls.isPlaying;
    State.steppersLoadingSubject.next(true);
    Controls.pause();
    StepQueue.clear();
    Pulses.restart();
    State.loadTemplate(name);

    await this.sequencer?.reload(false); // this inits steppers from state
    State.currentStepperIdSubject.next(State.getSelectedStepperId());
    State.templateReloadSubject.next(true);
    this.timeWorker.pause(); // also stops ui
    const ctx = Audio.getContext() as Tone.Context;
    this.ui = new UI(ctx, Pulses);
    if (!wasPaused) {
      this.timeWorker.start(this.ui, ctx); // that should only be true if was playing
      Controls.play();
    }
    State.steppersLoadingSubject.next(false);
  }

  // necessary because live updates to fast tempo cause the pulses to become out of sync...
  restart = async () => {
    const triggerPlay = Controls.isPlaying;
    StepQueue.clear();
    Controls.pause();
    Pulses.restart();
    this.timeWorker.pause(); // also stops ui
    await Audio.init(); // creates a new audio context
    const ctx = Audio.getContext() as Tone.Context;
    State.getTracks().forEach((track) => {
      track.instance.dispose();
      track.instance.init();
    });
    this.ui = new UI(ctx, Pulses);
    if (triggerPlay) {
      Controls.play();
      this.timeWorker.start(this.ui, ctx);
    }
  };

  handlePlayPause = async () => {
    if (!Controls.isPlaying) {
      this.timeWorker.start(this.ui, Audio.getContext() as Tone.Context);
      await Controls.play();
      return;
    }
    await Controls.pause();
    this.timeWorker.stop();
  };

  handleSpacePress = (e: KeyboardEvent) => {
    if (e.code === "Space") {
      e.preventDefault();
      this.handlePlayPause();
    }
  };
}

export default new Application();
