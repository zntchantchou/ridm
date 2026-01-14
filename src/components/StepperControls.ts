import State from "../state/State";
import type { StepperIdType } from "../state/state.types";
import Counter from "./Counter/Counter";
import Toggle from "./Toggle/Toggle";

type StepperControlsOptions = {
  stepperId: StepperIdType;
  stepsPerBeats: number;
  beats: number;
  name: string;
  color: string;
};

const controlsPanelElt = document.getElementById("steppers-controls");

class StepperControls {
  element: HTMLDivElement | null = null;
  stepperId: StepperIdType;
  stepsPerBeats: number = 0;
  beats: number = 0;
  minSteps = 1;
  minBeats = 2;
  maxSteps = 10;
  maxBeats = 10;
  name: string;
  soloCheckBox?: HTMLInputElement;
  muteCheckBox?: HTMLInputElement;
  color: string = "#000000";
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
    this.element.dataset["selected"] = "off";
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

    const soloMuteContainer = document.createElement("div");
    soloMuteContainer.classList.add("solo-mute-container");
    const resizeContainer = document.createElement("div");
    resizeContainer.classList.add("stepper-resize-container");
    const infoContainer = document.createElement("div");
    infoContainer.classList.add("stepper-info-container");
    soloMuteContainer.appendChild(this.createMuteToggleElt());
    soloMuteContainer.appendChild(this.createSoloToggleElt());
    resizeContainer.appendChild(beatsLabel);
    resizeContainer.appendChild(this.createBeatsCounterElt());

    resizeContainer.appendChild(stepsPerBeatLabel);
    resizeContainer.appendChild(this.createStepsCounterElt());

    infoContainer.appendChild(nameElt);
    this.element.appendChild(infoContainer);
    this.element.appendChild(soloMuteContainer);
    this.element.appendChild(resizeContainer);
    const deleteContainer = document.createElement("div");
    deleteContainer.classList.add("delete-container");
    const clearBtn = document.createElement("div");
    clearBtn.classList.add("clear-btn");
    clearBtn.textContent = "+";
    clearBtn.addEventListener("click", () => this.handleClear());
    deleteContainer.appendChild(clearBtn);
    this.element.appendChild(deleteContainer);
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

  private handleClear = () => {
    State.stepperSelectedStepsSubject.next({
      stepperId: this.stepperId,
      selectedSteps: Array(this.stepsPerBeats * this.beats).fill(false),
    });
    // TODO: Implement clear functionality
  };

  private createMuteToggleElt() {
    return new Toggle({
      text: "M",
      onClick: this.handleMute,
      color: this.color,
    }).getElement();
  }

  private createSoloToggleElt() {
    return new Toggle({
      text: "S",
      onClick: this.handleSolo,
      color: this.color,
    }).getElement();
  }

  private createStepsCounterElt() {
    return new Counter({
      onChange: (value) =>
        State.stepperResizeSubject.next({
          stepsPerBeat: value,
          stepperId: this.stepperId,
        }),
      min: 2,
      max: 10,
      initialValue: this.stepsPerBeats,
    }).getElement();
  }

  private createBeatsCounterElt() {
    return new Counter({
      onChange: (value) =>
        State.stepperResizeSubject.next({
          beats: value,
          stepperId: this.stepperId,
        }),
      min: 2,
      initialValue: this.beats,
      max: 10,
    }).getElement();
  }
}

export default StepperControls;
