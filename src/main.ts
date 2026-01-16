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
  sequencer?: Sequencer;

  constructor() {
    Audio.init();
    window.addEventListener("load", this.init);
    playBtn?.addEventListener("click", async () => this.handlePlayPause());
    pauseCtxBtn?.addEventListener("click", () => Controls.pause());
    restartBtn?.addEventListener("click", async () => await this.restart());
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
  };

  // necessary because live updates to fast tempo cause the pulses to become out of sync...
  restart = async () => {
    const triggerPlay = Controls.isPlaying;
    StepQueue.clear();
    Pulses.restart();
    Controls.pause();
    this.timeWorker.pause(); // also stops ui
    await Audio.init(); // creates a new audio context
    const ctx = Audio.getContext() as Tone.Context;
    Controls.init();
    this.ui = new UI(ctx, Pulses);
    this.timeWorker.start(this.ui, ctx);
    this.sequencer?.restart();
    this.initialized = false;
    if (!this.initialized && triggerPlay) {
      Controls.play();
      this.initialized = true;
    }
  };

  handlePlayPause = async () => {
    // Avoid cracking noise
    Audio.lastVolume = Audio.getCurrentVolume()?.value as number;
    Audio.setMasterVolume(Audio.minVolume);
    if (!Controls.isPlaying) {
      if (!this.initialized) {
        this.timeWorker.start(this.ui);
        this.initialized = true;
      }
      await Controls.play();
      Audio.setMasterVolume(Audio.lastVolume as number);
      return;
    }
    Audio.setMasterVolume(Audio.lastVolume as number);
    await Controls.pause();
  };

  handleSpacePress = (e: KeyboardEvent) => {
    if (e.code === "Space") {
      e.preventDefault();
      this.handlePlayPause();
    }
  };
}

new Application();
