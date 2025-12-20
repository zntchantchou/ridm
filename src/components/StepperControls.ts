const controlsPanelElt = document.getElementById("steppers-controls");

class StepperControls {
  element: HTMLDivElement | null = null;
  stepperId?: number;
  stepsPerBeats: number = 0;
  beats: number = 0;
  minSteps = 1;
  minBeats = 2;
  maxSteps = 10;
  maxBeats = 10;

  constructor({
    stepsPerBeats,
    beats,
    stepperId,
  }: {
    stepperId: number;
    stepsPerBeats: number;
    beats: number;
  }) {
    console.log("[StepperControls]");
    this.stepperId = stepperId;
    this.stepsPerBeats = stepsPerBeats;
    this.beats = beats;
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
    stepsPerBeatInput.type = "number";
    beatsInput.min = this.minBeats.toString();
    beatsInput.max = this.maxBeats.toString();
    stepsPerBeatInput.min = this.minSteps.toString();
    stepsPerBeatInput.max = this.maxSteps.toString();
    beatsInput.value = this.beats.toString();
    stepsPerBeatInput.value = this.stepsPerBeats.toString();
    console.log("RENDER INPUT STEPS PER BEAT ", stepsPerBeatInput, this);
    console.log("RENDER INPUT BEATS ", beatsInput);
    this.element.appendChild(beatsLabel);
    this.element.appendChild(beatsInput);
    this.element.appendChild(stepsPerBeatLabel);
    this.element.appendChild(stepsPerBeatInput);
    controlsPanelElt?.appendChild(this.element);
  }
}

export default StepperControls;
