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

const playBtn = document.getElementById("play");
const restartBtn = document.getElementById("restart");
const pauseCtxBtn = document.getElementById("pause-context");

class Application {
  initialized = false;
  timeWorker: Timerworker;
  ui: UI;
  // audioContext = new Tone.Context();
  sequencer?: Sequencer;

  constructor() {
    Audio.init();
    window.addEventListener("load", this.init);
    playBtn?.addEventListener("click", this.handleStart);
    pauseCtxBtn?.addEventListener("click", () =>
      Controls.pauseContext(Audio.getContext() as Tone.Context)
    );
    restartBtn?.addEventListener("click", async () => await this.restart());
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
  };

  // necessary because live updates to fast tempo cause the pulses to become out of sync...
  restart = async () => {
    const triggerPlay = Controls.isPlaying;
    // await Audio.getContext()?.close();
    StepQueue.clear();
    Pulses.restart();
    Controls.pauseContext(Audio.getContext() as Tone.Context);
    this.timeWorker.pause(); // also stops ui
    await Audio.init(); // creates a new audio context
    const ctx = Audio.getContext() as Tone.Context;
    Controls.init();
    this.ui = new UI(ctx, Pulses);
    this.timeWorker.start(this.ui, ctx);
    this.sequencer?.restart();
    this.initialized = false;
    if (!this.initialized && triggerPlay) {
      console.log("RESTART LAST IF: ", triggerPlay, this.initialized);
      Controls.play(ctx);
      this.initialized = true;
    }
  };

  handleStart = () => {
    if (!this.initialized) {
      this.timeWorker.start(this.ui);
      this.initialized = true;
    }
    if (!Controls.isPlaying) {
      const ctx = Audio?.getContext();
      console.log("RESUME");
      if (ctx?.state && ctx?.state !== "closed") {
        console.log("STATE of context ", ctx.state);
        Audio.getContext()?.resume();
      }
    }
  };
}

new Application();
