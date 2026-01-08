import Audio from "../modules/Audio";

const tpcRangeElt = document.getElementById("tpc-range") as HTMLInputElement;
const tpcDislayElt = document.getElementById("tpc") as HTMLDivElement;
const playPauseBtn = document.getElementById("play") as HTMLDivElement;
const playPauseImg = document.getElementById("play-img") as HTMLImageElement;
const volumeRangeElt = document.getElementById(
  "volume-range"
) as HTMLInputElement;
const volumeDisplayElt = document.getElementById("volume") as HTMLInputElement;

class Controls {
  tpc = 4;
  volume = 1;
  isPlaying: boolean = false;
  selectedStepper: number = 0;

  init() {
    playPauseBtn?.addEventListener(
      "click",
      async () => await this.togglePlay()
    );
    volumeRangeElt?.addEventListener("click", (e) => this.updateVolume(e));
    tpcRangeElt?.addEventListener("change", (e) => this.updateTpc(e));
    volumeRangeElt.value = this.volume.toString();
    volumeDisplayElt.textContent = this.volume.toString();
    tpcRangeElt.value = this.tpc.toString();
    tpcDislayElt.textContent = this.tpc.toString();
    playPauseImg.src = "/play-round.svg";
  }

  private updateTpc(e: Event) {
    const updatedValue = (e?.target as HTMLInputElement).value;
    this.tpc = parseInt(updatedValue);
    console.log("[Controls] UPDATE TPC: ", this.tpc);
    if (tpcDislayElt) tpcDislayElt.textContent = updatedValue;
  }

  private updateVolume(e: Event) {
    const updatedValue = (e?.target as HTMLInputElement).value;
    this.volume = parseFloat(updatedValue);
    console.log("[Controls] UPDATE Volume: ", this.volume);
    if (volumeDisplayElt) volumeDisplayElt.textContent = updatedValue;
    Audio.setMasterVolume(this.volume);
  }

  public togglePlay = async () => {
    if (!this.isPlaying) {
      this.isPlaying = true;

      playPauseImg.src = "/pause-round.svg";
      if (Audio.ctx?.state !== "running") return Audio.ctx?.resume();
      return;
    }
    playPauseImg.src = "/play-round.svg";
    this.isPlaying = false;
    // We have to use rawContext because we are relying on our own note scheduling implementation (based on AudioContext.currentTime).
    // Tone.Context does not allow an access to suspend, which is handled via the Transport component.
    // this pauses the current time, otherwise notes not played during pause would all be replayed when starting again
    return Audio.ctx?.rawContext?.suspend(Audio.ctx.now() as number);
  };
}

export default new Controls();
