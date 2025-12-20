const temporRangeElt = document.getElementById(
  "tempo-range"
) as HTMLInputElement;
const tpcRangeElt = document.getElementById("tpc-range") as HTMLInputElement;
const tpcDislayElt = document.getElementById("tpc") as HTMLDivElement;
const playPauseBtn = document.getElementById("play") as HTMLDivElement;

class Controls {
  tempo = 40;
  tpc = 4; // 60 / TPS = tempo
  isPlaying = false;

  init() {
    playPauseBtn?.addEventListener("click", this.togglePlay);
    tpcRangeElt?.addEventListener("change", (e) => this.updateTpc(e));
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

  private togglePlay() {
    this.isPlaying = !this.isPlaying;
  }
  // Controls must return all step-control elements
  // Sequencer will handle the update Events
  // - To update the stepper and its properties
  // - To rerender the given Stepper
  // - To notify pulses of the new stepper

  getBeatsInputs() {
    return Array.from(
      document.querySelectorAll(`input[name=beats]`)
    ) as HTMLInputElement[];
  }

  getStepsPerBeatInputs() {
    return Array.from(
      document.querySelectorAll(`input[name=steps-per-beat]`)
    ) as HTMLInputElement[];
  }
}

export default new Controls();
