import Audio from "./Audio";

const temporRangeElt = document.getElementById(
  "tempo-range"
) as HTMLInputElement;
const tpcRangeElt = document.getElementById("tpc-range") as HTMLInputElement;
const tpcDislayElt = document.getElementById("tpc") as HTMLDivElement;
const playPauseBtn = document.getElementById("play") as HTMLDivElement;
const volumeRangeElt = document.getElementById(
  "volume-range"
) as HTMLInputElement;
const volumeDisplayElt = document.getElementById("volume") as HTMLInputElement;

class Controls {
  tempo = 40;
  tpc = 4; // 60 / TPS = tempo
  volume = 1;
  isPlaying: boolean = false;
  selectedStepper: number = 0;

  init() {
    playPauseBtn?.addEventListener("click", this.togglePlay);
    volumeRangeElt?.addEventListener("click", (e) => this.updateVolume(e));
    tpcRangeElt?.addEventListener("change", (e) => this.updateTpc(e));
    volumeRangeElt.value = this.volume.toString();
    volumeDisplayElt.textContent = this.volume.toString();
    tpcRangeElt.value = this.tpc.toString();
    tpcDislayElt.textContent = this.tpc.toString();
  }

  private updateTpc(e: Event) {
    const updatedValue = (e?.target as HTMLInputElement).value;
    this.tpc = parseInt(updatedValue);
    console.log("[Controls] UPDATE TPC: ", this.tpc);
    if (tpcDislayElt) tpcDislayElt.textContent = updatedValue;
  }

  public getTempo(): number {
    return parseInt(temporRangeElt.value);
  }

  private updateVolume(e: Event) {
    const updatedValue = (e?.target as HTMLInputElement).value;
    this.volume = parseFloat(updatedValue);
    console.log("[Controls] UPDATE Volume: ", this.volume);
    if (volumeDisplayElt) volumeDisplayElt.textContent = updatedValue;
    Audio.setVolume(this.volume);
  }
  // use anonymous function expression so "this" can be referenced in the eventListener
  public togglePlay = () => {
    if (!this.isPlaying) {
      this.isPlaying = true;
      Audio.ctx?.resume(); // this resumes the current time
      return;
    }
    this.isPlaying = false;
    Audio.ctx?.suspend(); // this pauses the current time, otherwise notes not played during pause would all be replayed when starting again
    // console.log("[TOGGLE PLAY]SET IS PLAYING TO FALSE", this.isPlaying);
  };
  // Controls must return all step-control elements
  // Sequencer will handle the update Events
  // - To update the stepper and its properties
  // - To rerender the given Stepper
  // - To notify pulses of the new stepper
}

export default new Controls();
