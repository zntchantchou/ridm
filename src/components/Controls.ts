import Audio from "../modules/Audio";
import State from "../state/State";
import { INITIAL_SETTINGS } from "../state/state.constants";
import * as Tone from "tone";

const tpcRangeElt = document.getElementById("tpc-range") as HTMLInputElement;
const tpcDislayElt = document.getElementById("tpc") as HTMLDivElement;
const playPauseImg = document.getElementById("play-img") as HTMLImageElement;
const volumeRangeElt = document.getElementById(
  "volume-range"
) as HTMLInputElement;
const volumeDisplayElt = document.getElementById("volume") as HTMLInputElement;

class Controls {
  tpc = State.getSettings().tpc || INITIAL_SETTINGS.tpc;
  volume = State.getSettings().volume || INITIAL_SETTINGS.volume;
  isPlaying: boolean = false;

  constructor() {
    volumeRangeElt?.addEventListener("click", (e) => this.updateVolume(e));
    tpcRangeElt?.addEventListener("change", (e) => this.updateTpc(e));
    volumeRangeElt.value = this.volume.toString();
    volumeDisplayElt.textContent = this.volume.toString();
    tpcRangeElt.value = this.tpc.toString();
    tpcDislayElt.textContent = this.tpc.toString();
    playPauseImg.src = "/play-round.svg";
  }

  init() {
    Audio.setMasterVolume(this.volume);
  }

  private updateTpc(e: Event) {
    Audio.lastVolume = Audio.getCurrentVolume()?.value as number;
    Audio.setMasterVolume(Audio.minVolume); // avoid cracking noise
    State.steppersLoadingSubject.next(true);
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
