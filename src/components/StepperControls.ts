const controlsPanelElt = document.getElementById("steppers-controls");

class StepperControls {
  element: HTMLDivElement | null = null;
  stepperId: number;
  stepsPerBeats: number = 0;
  beats: number = 0;
  minSteps = 1;
  minBeats = 2;
  maxSteps = 10;
  maxBeats = 10;
  name: string;

  constructor({
    stepsPerBeats,
    beats,
    stepperId,
    name,
  }: {
    stepperId: number;
    stepsPerBeats: number;
    beats: number;
    name: string;
  }) {
    // console.log("[StepperControls]");
    this.stepperId = stepperId;
    this.stepsPerBeats = stepsPerBeats;
    this.beats = beats;
    this.name = name;
    this.render();
  }

  render() {
    this.element = document.createElement("div");
    this.element.classList.add("stepper-controls");
    const beatsLabel = document.createElement("span");
    const stepsPerBeatLabel = document.createElement("span");
    const beatsInput = document.createElement("input");
    const stepsPerBeatInput = document.createElement("input");
    beatsLabel.textContent = "beats";
    stepsPerBeatLabel.textContent = "steps";
    beatsInput.type = "number";
    stepsPerBeatInput.name = "steps-per-beat";
    beatsInput.name = "beats";
    beatsInput.dataset["stepperId"] = this.stepperId.toString();
    stepsPerBeatInput.dataset["stepperId"] = this.stepperId.toString();
    stepsPerBeatInput.type = "number";
    beatsInput.min = this.minBeats.toString();
    beatsInput.max = this.maxBeats.toString();
    stepsPerBeatInput.min = this.minSteps.toString();
    stepsPerBeatInput.max = this.maxSteps.toString();
    beatsInput.value = this.beats.toString();
    stepsPerBeatInput.value = this.stepsPerBeats.toString();
    const nameElt = document.createElement("span");
    nameElt.classList.add("stepperControlName");
    nameElt.textContent = this.name;
    this.element.appendChild(nameElt);
    this.element.appendChild(beatsLabel);
    this.element.appendChild(beatsInput);
    this.element.appendChild(stepsPerBeatLabel);
    this.element.appendChild(stepsPerBeatInput);
    controlsPanelElt?.appendChild(this.element);
  }
}

export default StepperControls;
