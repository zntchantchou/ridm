const temporRangeElt = document.getElementById("tempo-range") as HTMLDivElement;
const tempoDisplayElt = document.getElementById("tempo") as HTMLDivElement;

class Controls {
  tempo = 110;

  init() {
    temporRangeElt?.addEventListener("change", this.updateTempo);
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
