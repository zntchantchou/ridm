import State from "../state/state";
import Toggle from "./Toggle/Toggle";

type StepperControlsOptions = {
  stepperId: number;
  stepsPerBeats: number;
  beats: number;
  name: string;
  color: string;
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
  color?: string;
  constructor({
    stepsPerBeats,
    beats,
    stepperId,
    name,
    color,
  }: StepperControlsOptions) {
    this.stepperId = stepperId;
    this.stepsPerBeats = stepsPerBeats;
    this.beats = beats;
    this.name = name;
    this.color = color;
    this.render();
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
    const muteToggle = new Toggle({
      text: "M",
      onClick: this.handleMute,
      color: this.color || "#000000",
    }).render();
    const soloToggle = new Toggle({
      text: "S",
      onClick: this.handleSolo,
      color: this.color || "#000000",
    }).render();
    const soloMuteContainer = document.createElement("div");
    soloMuteContainer.classList.add("solo-mute-container");
    const resizeContainer = document.createElement("div");
    resizeContainer.classList.add("stepper-resize-container");
    const infoContainer = document.createElement("div");
    infoContainer.classList.add("stepper-info-container");
    soloMuteContainer.appendChild(muteToggle);
    soloMuteContainer.appendChild(soloToggle);
    resizeContainer.appendChild(beatsLabel);
    resizeContainer.appendChild(beatsInput);
    resizeContainer.appendChild(stepsPerBeatLabel);
    resizeContainer.appendChild(stepsPerBeatInput);

    infoContainer.appendChild(nameElt);
    this.element.appendChild(infoContainer);
    this.element.appendChild(soloMuteContainer);
    this.element.appendChild(resizeContainer);
    controlsPanelElt?.appendChild(this.element);
  }

  private handleSolo = (v: boolean) => {
    State.effectUpdateSubject.next({
      name: "solo",
      stepperId: this.stepperId.toString(),
      value: { solo: v },
    });
  };

  private handleMute = (v: boolean) => {
    State.effectUpdateSubject.next({
      name: "mute",
      stepperId: this.stepperId.toString(),
      value: { mute: v },
    });
  };
}

export default StepperControls;
