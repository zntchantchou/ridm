const temporRangeElt = document.getElementById("tempo-range") as HTMLDivElement;
const tempoDisplayElt = document.getElementById("tempo") as HTMLDivElement;

class Controls {
  tempo = 110;
  constructor() {
    console.log;
  }

  init() {
    temporRangeElt?.addEventListener("change", this.updateTempo);
    tempoDisplayElt.textContent = this.tempo.toString();
  }

  updateTempo(e: Event) {
    const updatedValue = (e?.target as HTMLInputElement).value;
    this.tempo = parseInt(updatedValue);
    console.log("UPDATE TEMPO");
    console.log("elt ", document.getElementById("tempo"));
    console.log("this.tempoDispl ", tempoDisplayElt);
    if (tempoDisplayElt) tempoDisplayElt.textContent = updatedValue;
  }
}

export default new Controls();
