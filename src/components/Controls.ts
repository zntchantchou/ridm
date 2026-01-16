import Audio from "../modules/Audio";
import State from "../state/State";
import { INITIAL_SETTINGS } from "../state/state.constants";
import * as Tone from "tone";
import Fader from "./Fader/Fader";

const tpcDislayElt = document.createElement("div");
const tpcGroupElt = document.getElementById("tpc-group") as HTMLDivElement;
const volumeGroupElt = document.getElementById(
  "volume-group"
) as HTMLDivElement;
const playPauseImg = document.getElementById("play-img") as HTMLImageElement;
const volumeDisplayElt = document.createElement("div");

class Controls {
  tpc = State.getSettings().tpc || INITIAL_SETTINGS.tpc;
  volume = State.getSettings().volume || INITIAL_SETTINGS.volume;
  isPlaying: boolean = false;
  tpcRange?: HTMLDivElement;
  volumeRange?: HTMLDivElement;
  constructor() {
    this.renderControls();
  }

  renderControls() {
    volumeDisplayElt.textContent = this.volume.toString();
    tpcDislayElt.textContent = this.tpc.toString();
    playPauseImg.src = "/play-round.svg";
    this.tpcRange = new Fader({
      initialValue: this.tpc,
      id: "tpc-range",
      min: 1,
      max: 8,
      variant: "positive",
      step: 0.1,
      onChange: this.updateTpc,
    }).render();
    this.volumeRange = new Fader({
      initialValue: this.volume,
      id: "volume-range",
      min: -40,
      max: 40,
      step: 0.1,
      variant: "positive",
      onChange: this.updateVolume,
    }).render();
    tpcGroupElt.appendChild(this.tpcRange);
    tpcDislayElt.id = "tpc-display";
    volumeDisplayElt.id = "volume-display";
    tpcGroupElt.appendChild(tpcDislayElt);
    volumeGroupElt.appendChild(this.volumeRange);
    volumeGroupElt.appendChild(volumeDisplayElt);
  }

  init() {
    Audio.setMasterVolume(this.volume);
  }

  private updateTpc(e: Event) {
    State.steppersLoadingSubject.next(true);
    Audio.lastVolume = Audio.getCurrentVolume()?.value as number;
    Audio.setMasterVolume(Audio.minVolume); // avoid cracking noise
    const updatedValue = (e?.target as HTMLInputElement).value;
    this.tpc = parseFloat(updatedValue);
    if (tpcDislayElt) tpcDislayElt.textContent = updatedValue;
    State.tpcUpdateSubject.next(this.tpc);
    State.steppersLoadingSubject.next(false);
  }

  private updateVolume(e: Event) {
    const updatedValue = (e?.target as HTMLInputElement).value;
    this.volume = parseFloat(updatedValue);
    if (volumeDisplayElt) volumeDisplayElt.textContent = updatedValue;
    Audio.setMasterVolume(this.volume);
    State.volumeUpdateSubject.next(this.volume);
  }

  public async pause() {
    this.isPlaying = false;
    playPauseImg.src = "/play-round.svg";
    if (Audio.getContext()?.state !== "closed") {
      // We have to use rawContext because we are relying on our own note scheduling implementation (based on AudioContext.currentTime).
      // Tone.Context does not allow an access to suspend, which is handled via the Transport component.
      // this pauses the current time, otherwise notes not played during pause would all be replayed when starting again
      await Audio.getContext()?.rawContext?.suspend(
        Audio.getContext()?.now() as number
      );
    }
  }

  public async play() {
    // get the current Volume

    this.isPlaying = true;
    playPauseImg.src = "/pause-round.svg";
    const ctx = Audio.getContext() as Tone.Context;
    if (ctx.state !== "closed") {
      await ctx.resume();
      // Audio.setMasterVolume(currentVolume as number);
    }
  }
}

export default new Controls();
