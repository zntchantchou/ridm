import Controls from "./components/Controls";
import Timerworker from "./modules/Timerworker";
import Sequencer from "./modules/Sequencer";
import Audio from "./modules/Audio";
import Pulses from "./modules/Pulses";
import UI from "./components/Ui";
import * as Tone from "tone";
import "./state/State";

const playBtn = document.getElementById("play");
const restartBtn = document.getElementById("restart");

class Application {
  initialized = false;
  timeWorker: Timerworker;
  ui: UI;
  audioContext = new Tone.Context();

  constructor() {
    window.addEventListener("load", this.init);
    playBtn?.addEventListener("click", async () => await this.handleStart());
    // restartBtn?.addEventListener("click", async () => await this.restart());
    this.ui = new UI(this.audioContext, Pulses);
    this.timeWorker = new Timerworker({
      pulses: Pulses,
      audioContext: this.audioContext,
    });
  }

  init = async () => {
    await Audio.init(this.audioContext);
    Controls.init();
    const sequencer = new Sequencer(Pulses);
    await sequencer.initialize();
  };

  handleStart = async () => {
    if (!this.initialized) {
      await Audio.start();
      this.timeWorker.start(this.ui);
      this.initialized = true;
    }
    if (!Controls.isPlaying) this.audioContext.resume();
  };

  // restart = async () => {
  //   console.log("RESTART ");
  //   Controls.pause();
  //   this.initialized = false;
  //   this.timeWorker.stop();
  //   Pulses.restart();
  //   this.audioContext = new Tone.Context();
  //   this.ui = new UI(this.audioContext, Pulses);
  //   this.timeWorker.start(this.ui);
  //   // Audio.restart(this.audioContext);
  //   // this.timeWorker = new Timerworker({
  //   //   pulses: Pulses,
  //   //   audioContext: this.audioContext,
  //   // });
  //   // await this.handleStart();
  //   Controls.play();
  // };
}

new Application();
