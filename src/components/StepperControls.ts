import State from "../state/State";

type StepperControlsOptions = {
  stepperId: number;
  stepsPerBeats: number;
  beats: number;
  name: string;
};

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
  soloCheckBox?: HTMLInputElement;
  muteCheckBox?: HTMLInputElement;

  constructor({
    stepsPerBeats,
    beats,
    stepperId,
    name,
  }: StepperControlsOptions) {
    this.stepperId = stepperId;
    this.stepsPerBeats = stepsPerBeats;
    this.beats = beats;
    this.name = name;
    this.render();
    this.initializeEvents();
  }

  private render() {
    this.element = document.createElement("div");
    this.element.classList.add("stepper-controls");
    this.element.dataset["stepperId"] = this.stepperId.toString();
    const muteLabel = document.createElement("span");
    const soloLabel = document.createElement("span");
    this.soloCheckBox = document.createElement("input");
    this.muteCheckBox = document.createElement("input");

    const beatsLabel = document.createElement("span");
    const stepsPerBeatLabel = document.createElement("span");
    const beatsInput = document.createElement("input");
    const stepsPerBeatInput = document.createElement("input");
    soloLabel.textContent = "S";
    muteLabel.textContent = "M";
    this.soloCheckBox.type = "checkbox";
    this.muteCheckBox.type = "checkbox";
    this.soloCheckBox.checked = false;
    this.soloCheckBox.checked = false;

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
    this.element.appendChild(soloLabel);
    this.element.appendChild(this.soloCheckBox);
    this.element.appendChild(muteLabel);
    this.element.appendChild(this.muteCheckBox);
    this.element.appendChild(beatsLabel);
    this.element.appendChild(beatsInput);
    this.element.appendChild(stepsPerBeatLabel);
    this.element.appendChild(stepsPerBeatInput);
    controlsPanelElt?.appendChild(this.element);
  }

  private initializeEvents() {
    this.soloCheckBox?.addEventListener("change", this.handleSolo);
    this.muteCheckBox?.addEventListener("change", this.handleMute);
  }

  private handleSolo = (e: Event) => {
    const soloTarget = e.target as HTMLInputElement;
    console.log("HANDLE SOLO ", soloTarget.checked);
    State.effectUpdateSubject.next({
      name: "solo",
      stepperId: this.stepperId.toString(),
      value: { mute: soloTarget.checked },
    });
    console.log("STEPPER CTRL ", this);
  };

  private handleMute = (e: Event) => {
    const muteTarget = e.target as HTMLInputElement;
    console.log("HANDLE MUTE ", muteTarget.checked);
    State.effectUpdateSubject.next({
      name: "mute",
      stepperId: this.stepperId.toString(),
      value: { mute: muteTarget.checked },
    });
    console.log("STEPPER CTRL ", this);
  };
}

export default StepperControls;
