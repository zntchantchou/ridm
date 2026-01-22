import Audio from "../modules/Audio";
import State from "../state/State";
import {
  INITIAL_SETTINGS,
  MAX_VOLUME_DB,
  MIN_VOLUME_DB,
} from "../state/state.constants";
import * as Tone from "tone";
import Fader from "./Fader/Fader";

const tpcDislayElt = document.createElement("div");
const tpcGroupElt = document.getElementById("tpc-group") as HTMLDivElement;
const volumeGroupElt = document.getElementById(
  "volume-group",
) as HTMLDivElement;
const playPauseImg = document.getElementById("play-img") as HTMLImageElement;
const volumeDisplayElt = document.createElement("div");

class Controls {
  tpc = State.getSettings().tpc || INITIAL_SETTINGS.tpc;
  volume = State.getSettings().volume || INITIAL_SETTINGS.volume;
  isPlaying: boolean = false;
  tpcRange?: HTMLInputElement;
  volumeRange?: HTMLInputElement;
  constructor() {
    this.renderControls();
  }

  renderControls() {
    volumeDisplayElt.textContent = this.volume.toString();
    tpcDislayElt.textContent = this.tpc.toString();
    playPauseImg.src = "./pictures/play-round.svg";
    this.tpcRange = new Fader({
      initialValue: this.tpc,
      id: "tpc-range",
      min: 1,
      max: 6,
      variant: "positive",
      step: 0.01,
      onChange: this.handleTpcChange,
    }).render();
    this.volumeRange = new Fader({
      initialValue: this.volume,
      id: "volume-range",
      min: MIN_VOLUME_DB,
      max: MAX_VOLUME_DB,
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
    this.updateVolumeLabel();
  }

  init() {
    Audio.setMasterVolume(this.volume);
  }

  private handleTpcChange(e: Event) {
    State.steppersLoadingSubject.next(true);
    Audio.lastVolume = Audio.getCurrentVolume() as number;
    Audio.mute(); // avoid cracking noise
    const updatedValue = (e?.target as HTMLInputElement).value;
    this.tpc = parseFloat(updatedValue);
    State.tpcUpdateSubject.next(parseFloat(updatedValue));

    if (tpcDislayElt) tpcDislayElt.textContent = updatedValue;
    State.steppersLoadingSubject.next(false);
  }

  private updateVolumeLabel = () => {
    let percentage = 0;
    const amplitude = MAX_VOLUME_DB - MIN_VOLUME_DB;
    if (this.volume < 0) {
      const diff = -1 * (MIN_VOLUME_DB - this.volume);
      const ratio = diff / amplitude;
      percentage = ratio * 100;
    } else {
      const startRatio = -MIN_VOLUME_DB / amplitude;
      const ratio = this.volume / amplitude;
      percentage = (startRatio + ratio) * 100;
    }
    volumeDisplayElt.textContent = percentage.toFixed(1);
  };

  private updateVolume = (e: Event) => {
    const updatedValue = (e?.target as HTMLInputElement).value;
    this.volume = parseFloat(updatedValue);
    if (volumeDisplayElt) volumeDisplayElt.textContent = updatedValue;
    Audio.setMasterVolume(this.volume);
    State.volumeUpdateSubject.next(this.volume);
    this.updateVolumeLabel();
  };

  public async pause() {
    this.isPlaying = false;
    playPauseImg.src = "./pictures/play-round.svg";
    if (Audio.getContext()?.state !== "closed") {
      // We have to use rawContext because we are relying on our own note scheduling implementation (based on AudioContext.currentTime).
      // Tone.Context does not allow an access to suspend, which is handled via the Transport component.
      // this pauses the current time, otherwise notes not played during pause would all be replayed when starting again
      await Audio.getContext()?.rawContext?.suspend(
        Audio.getContext()?.now() as number,
      );
    }
  }

  public async play() {
    // get the current Volume

    this.isPlaying = true;
    playPauseImg.src = "./pictures/pause-round.svg";
    const ctx = Audio.getContext() as Tone.Context;
    if (ctx.state !== "closed") {
      await ctx.resume();
      // Audio.setMasterVolume(currentVolume as number);
    }
  }
}

export default new Controls();
