import Controls from "./components/Controls";
import Timerworker from "./modules/Timerworker";
import Sequencer from "./modules/Sequencer";
import Audio from "./modules/Audio";
import Pulses from "./modules/Pulses";
import UI from "./components/Ui";
import * as Tone from "tone";
import "./state/State";
import State from "./state/State";
import StepQueue from "./modules/StepQueue";
import type { TemplateName } from "./state/state.types";

const playBtn = document.getElementById("play");
const resetBtn = document.getElementById("reset-btn") as HTMLDivElement;
const pauseCtxBtn = document.getElementById("pause-context");
const footerElt = document.getElementById("footer");
const template1Btn = document.getElementById("template1");
const template2Btn = document.getElementById("template2");

class Application {
  initialized = false;
  timeWorker: Timerworker;
  ui: UI;
  sequencer?: Sequencer;

  constructor() {
    Audio.init();
    window.addEventListener("load", this.init);
    playBtn?.addEventListener("click", async () => this.handlePlayPause());
    pauseCtxBtn?.addEventListener("click", () => Controls.pause());
    resetBtn?.addEventListener(
      "click",
      async () => await this.loadTemplate("initial"),
    );
    template1Btn?.addEventListener(
      "click",
      async () => await this.loadTemplate("nottoochaabi"),
    );
    template2Btn?.addEventListener(
      "click",
      async () => await this.loadTemplate("mamakossa"),
    );

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
    footerElt!.style.visibility = "visible";
    State.currentStepperIdSubject.next(State.getSelectedStepperId());
  };

  async loadTemplate(name: TemplateName) {
    const wasPaused = !Controls.isPlaying;
    State.steppersLoadingSubject.next(true);
    Controls.pause();
    const stepperControls = document.getElementById(
      "steppers-controls",
    ) as HTMLDivElement;
    const steppers = document.getElementById("steppers") as HTMLDivElement;
    while (stepperControls.lastElementChild) {
      stepperControls.removeChild(stepperControls.lastElementChild);
    }
    while (steppers.lastElementChild) {
      steppers.removeChild(steppers.lastElementChild);
    }
    State.loadTemplate(name);
    await this.sequencer?.reload(); // this inits steppers from state
    State.currentStepperIdSubject.next(State.getSelectedStepperId());
    StepQueue.clear();
    Pulses.restart();
    this.timeWorker.pause(); // also stops ui
    await Audio.init(); // creates a new audio context
    const ctx = Audio.getContext() as Tone.Context;
    this.ui = new UI(ctx, Pulses);
    this.sequencer?.restart(); // also inits steppers from state ....
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
    this.ui = new UI(ctx, Pulses);
    this.sequencer?.restart();
    if (triggerPlay) {
      Controls.play();
      this.timeWorker.start(this.ui, Audio.getContext() as Tone.Context);
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

new Application();
