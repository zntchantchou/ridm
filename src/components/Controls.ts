const temporRangeElt = document.getElementById(
  "tempo-range"
) as HTMLInputElement;
const tempoDisplayElt = document.getElementById("tempo") as HTMLDivElement;
const playPauseBtn = document.getElementById("play") as HTMLDivElement;

class Controls {
  tempo = 40;
  isPlaying = false;

  init() {
    temporRangeElt?.addEventListener("change", this.updateTempo);
    playPauseBtn?.addEventListener(
      "click",
      () => (this.isPlaying = !this.isPlaying)
    );
    temporRangeElt.value = this.tempo.toString();
    tempoDisplayElt.textContent = this.tempo.toString();
  }

  private updateTempo(e: Event) {
    const updatedValue = (e?.target as HTMLInputElement).value;
    this.tempo = parseInt(updatedValue);
    console.log("[Controls] UPDATE TEMPO: ", this.tempo);
    if (tempoDisplayElt) tempoDisplayElt.textContent = updatedValue;
  }

  public getTempo(): number {
    return parseInt(temporRangeElt.value);
  }
}

export default new Controls();
