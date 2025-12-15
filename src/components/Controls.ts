const temporRangeElt = document.getElementById("tempo-range") as HTMLDivElement;
const tempoDisplayElt = document.getElementById("tempo") as HTMLDivElement;
const playPauseBtn = document.getElementById("play") as HTMLDivElement;

class Controls {
  tempo = 110;
  isPlaying = false;

  init() {
    temporRangeElt?.addEventListener("change", this.updateTempo);
    playPauseBtn?.addEventListener(
      "click",
      () => (this.isPlaying = !this.isPlaying)
    );
    tempoDisplayElt.textContent = this.tempo.toString();
  }

  updateTempo(e: Event) {
    const updatedValue = (e?.target as HTMLInputElement).value;
    this.tempo = parseInt(updatedValue);
    console.log("UPDATE TEMPO");
    if (tempoDisplayElt) tempoDisplayElt.textContent = updatedValue;
  }
}

export default new Controls();
