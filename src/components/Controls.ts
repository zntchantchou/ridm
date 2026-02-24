import Audio from "../modules/Audio";
import State from "../state/State";
import { INITIAL_SETTINGS } from "../state/state.constants";
import * as Tone from "tone";

class Controls {
  tpc = INITIAL_SETTINGS.tpc;
  volume = INITIAL_SETTINGS.volume;
  isPlaying: boolean = false;
  tpcRange?: HTMLInputElement;
  volumeRange?: HTMLInputElement;
  resetBtn?: HTMLDivElement;

  init() {
    Audio.setMasterVolume(this.volume);
  }

  public async pause() {
    State.isPlayingSubject.next(false);
    this.isPlaying = false;
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
    State.isPlayingSubject.next(true);
    this.isPlaying = true;
    const ctx = Audio.getContext() as Tone.Context;
    if (ctx.state !== "closed") {
      await ctx.resume();
    }
  }
}

export default new Controls();
