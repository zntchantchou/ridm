const temporRangeElt = document.getElementById(
  "tempo-range"
) as HTMLInputElement;
const tempoDisplayElt = document.getElementById("tempo") as HTMLDivElement;
const tpcRangeElt = document.getElementById("tpc-range") as HTMLInputElement;
const tpcDislayElt = document.getElementById("tpc") as HTMLDivElement;
const playPauseBtn = document.getElementById("play") as HTMLDivElement;

class Controls {
  tempo = 40;
  tpc = 4; // 60 / TPS = tempo
  isPlaying = false;

  init() {
    playPauseBtn?.addEventListener("click", this.togglePlay);
    temporRangeElt?.addEventListener("change", (e) => this.updateTempo(e));
    tpcRangeElt?.addEventListener("change", (e) => this.updateTpc(e));
    tpcRangeElt.value = this.tpc.toString();
    temporRangeElt.value = this.tempo.toString();
    tpcDislayElt.textContent = this.tpc.toString();
    tempoDisplayElt.textContent = this.tempo.toString();
  }

  private updateTempo(e: Event) {
    const updatedValue = (e?.target as HTMLInputElement).value;
    this.tempo = parseInt(updatedValue);
    console.log("[Controls] UPDATE TEMPO: ", this.tempo);
    if (tempoDisplayElt) tempoDisplayElt.textContent = updatedValue;
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
}

export default new Controls();
