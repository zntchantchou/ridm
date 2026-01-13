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
  audioContext = new Tone.Context();
  sequencer?: Sequencer;

  constructor() {
    window.addEventListener("load", this.init);
    playBtn?.addEventListener("click", async () => await this.handleStart());
    pauseCtxBtn?.addEventListener("click", () =>
      Controls.pauseContext(this.audioContext)
    );
    restartBtn?.addEventListener("click", async () => await this.restart());
    this.ui = new UI(this.audioContext, Pulses);
    this.timeWorker = new Timerworker({
      pulses: Pulses,
      audioContext: this.audioContext,
    });
  }

  init = async () => {
    // sets audioContext
    await Audio.init(this.audioContext);
    // sets volume from state
    // creates listeners for volume and tpc
    Controls.init();
    this.sequencer = new Sequencer(Pulses);
    await this.sequencer.initialize();
    State.tpcUpdateSubject.subscribe(() => this.restart());
  };

  // necessary because live updates to fast tempo cause the pulses to become out of sync...
  restart = async () => {
    // empty step queue (otherwise ui freezes)
    await this.audioContext.close();
    StepQueue.clear();
    Pulses.restart();
    Controls.pause();
    this.timeWorker.pause(); // also stops ui
    this.audioContext = new Tone.Context();
    await Audio.init(this.audioContext);
    Controls.init();

    this.ui = new UI(this.audioContext, Pulses);
    this.timeWorker.start(this.ui, this.audioContext);
    this.sequencer?.restart();
    this.initialized = false;
    if (!this.initialized) {
      Controls.play();
      this.initialized = true;
    }
    if (!Controls.isPlaying && this.audioContext.state !== "closed") {
      this.audioContext.resume();
    }
    State.steppersLoadingSubject.next(false);
  };

  handleStart = async () => {
    if (!this.initialized) {
      this.timeWorker.start(this.ui);
      this.initialized = true;
    }
    if (!Controls.isPlaying) this.audioContext.resume();
  };
}

new Application();
