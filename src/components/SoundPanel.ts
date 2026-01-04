import type { Subject } from "rxjs";
import type Stepper from "./Stepper";
import * as Tone from "tone";
import type { EffectNameType, EffectUpdate } from "../types";
import PanelSection from "./PanelSection/PanelSection";

const rootElt = document.getElementById("top-panel");
const stepperElements = document.getElementsByClassName("stepper");
const stepperControlElements =
  document.getElementsByClassName("stepper-controls");

class SoundPanel {
  selectedStepper = "0";
  steppers: Stepper[] = [];
  element?: HTMLDivElement;
  effectUpdateSubject: Subject<EffectUpdate>;
  panningRange?: HTMLInputElement;
  volumeRange?: HTMLInputElement;
  delayWetRange?: HTMLInputElement;
  delayFeedbackRange?: HTMLInputElement;
  delayTimeRange?: HTMLInputElement;
  panningValue?: HTMLSpanElement;
  volumeValue?: HTMLSpanElement;

  constructor({
    steppers,
    effectUpdateSubject,
  }: {
    steppers: Stepper[];
    effectUpdateSubject: Subject<EffectUpdate>;
  }) {
    this.steppers = steppers;
    this.effectUpdateSubject = effectUpdateSubject;
    this.element = document.createElement("div");
    this.element.id = "sound-panel";
    rootElt!.appendChild(this.element);
    this.initialize();
    this.initializeEvents();
    this.render();
  }

  render() {
    const sampleNameElt = document.getElementById("sample-name");
    const stepper = this.getSelectedStepper() as Stepper;
    sampleNameElt!.textContent = stepper.sampleName;
    this.setBackground();
    // DELAY
    const delayValues = this.getEffectValues("delay") as Tone.FeedbackDelay;
    this!.delayTimeRange!.value = delayValues.delayTime.toString();
    this!.delayFeedbackRange!.value = delayValues.feedback.toString();
    this!.delayWetRange!.value = delayValues.wet.toString();
    // VOLUME
    const channel = stepper.track?.channel?.get();
    this!.panningRange!.value = channel?.pan.toString() as string;
    this!.panningValue!.textContent = channel?.pan.toString() as string;
    this!.volumeRange!.value = channel?.volume.toString() as string;
    this!.volumeValue!.textContent = channel?.volume.toFixed(1) as string;
  }

  private setBackground() {
    const stepper = this.getSelectedStepper() as Stepper;
    if (rootElt) {
      rootElt.style.background = `linear-gradient(0deg,rgba(0, 0, 0, 1) 0%, ${stepper.color?.cssColor} 100%)`;
    }
    const currentStepper = this.getSelectedStepper();
    const currentStepperControlsElt = currentStepper?.controls
      ?.element as HTMLDivElement;
    currentStepperControlsElt.dataset["selected"] = "on";
    currentStepperControlsElt.style.borderLeft = `solid .3rem ${
      currentStepper!.color?.cssColor
    }`;
  }

  private initialize() {
    const sampleDetailsSection = document.createElement("div");
    sampleDetailsSection.classList.add("sample-details");
    const nameGroup = document.createElement("div");
    const nameValueSpan = document.createElement("span");
    nameValueSpan.id = "sample-name";

    nameGroup.appendChild(nameValueSpan);
    sampleDetailsSection.appendChild(nameGroup);
    sampleDetailsSection.appendChild(this.generateVolumeGroup());
    sampleDetailsSection.appendChild(this.generatePanningGroup());
    // sampleDetailsSection.appendChild(this.generateDelayGroup());

    this.element?.appendChild(sampleDetailsSection);
    new PanelSection({
      title: "delay",
      settings: [
        {
          label: "wet",
          name: "wet",
          inputType: "knob",
          min: 0,
          max: 1,
          value: 0.3,
          onChange: this.handleDelayChange,
        },
        {
          label: "feedback",
          name: "feedback",
          inputType: "knob",
          min: 0,
          max: 1,
          value: 0,
          onChange: this.handleDelayChange,
        },
        {
          label: "time",
          name: "delayTime",
          inputType: "knob",
          min: 0,
          max: 1,
          value: 0,
          onChange: this.handleDelayChange,
        },
      ],
      parentElt: this.element as HTMLDivElement,
    });
  }

  private initializeEvents() {
    for (const elt of [...stepperControlElements, ...stepperElements]) {
      elt.addEventListener("click", this.handleStepperSelection);
    }

    const volumeRangeElt = document.getElementById("stepper-volume-range");
    console.log("VOLUME RANGE", volumeRangeElt);
    volumeRangeElt?.addEventListener("change", this.handleVolumeChange);

    const pannerRangeElt = document.getElementById(
      "panning-range"
    ) as HTMLInputElement;
    pannerRangeElt?.addEventListener("change", this.handlePanningChange);
  }

  private handleVolumeChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    console.log("handleVolumeChange", {
      name: "volume",
      stepperId: this.selectedStepper,
      value: { volume: parseFloat(target.value) },
    });
    this.effectUpdateSubject.next({
      name: "volume",
      stepperId: this.selectedStepper,
      value: { volume: parseFloat(target.value) },
    });
    this.render();
  };

  private handlePanningChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    console.log("handlePanningChange ", {
      name: "panning",
      stepperId: this.selectedStepper,
      value: { pan: parseFloat(target.value) },
    });
    this.effectUpdateSubject.next({
      name: "panning",
      stepperId: this.selectedStepper,
      value: { pan: parseFloat(target.value) },
    });
    this.render();
  };

  private handleDelayChange = (value: string, name: string) => {
    // const target = e.target as HTMLInputElement;
    console.log("HANDLE DELAY CHANGE");
    const rangeValue = parseFloat(value);
    const updateValue: { feedback?: number; wet?: number; delayTime?: number } =
      {};
    switch (name) {
      case "feedback":
        updateValue.feedback = rangeValue;
        break;
      case "wet":
        updateValue.wet = rangeValue;
        break;
      case "delayTime":
        updateValue.delayTime = rangeValue;
        break;
    }
    this.effectUpdateSubject.next({
      name: "delay",
      stepperId: this.selectedStepper,
      value: updateValue,
    });
    this.render();
  };

  private getSelectedStepper() {
    const selected = this.steppers.find((s) => {
      return s.id?.toString() === this.selectedStepper;
    });
    return selected;
  }

  private handleStepperSelection = (e: Event) => {
    const target = e?.target as HTMLDivElement;
    let stepperId = target.dataset.stepperId;
    const previousStepper = this.getSelectedStepper();
    const previousStepperControlsElt = previousStepper!.controls
      ?.element as HTMLDivElement;
    previousStepperControlsElt.dataset["selected"] = "off";
    previousStepperControlsElt.style.borderColor = "transparent";
    if (stepperId === undefined) {
      // TODO: Find a better way to get the event on the correct element
      stepperId = target.parentElement?.dataset.stepperId;
    }
    if (typeof stepperId === "string") {
      this.selectedStepper = stepperId;
    }
    const currentStepper = this.getSelectedStepper();
    if (rootElt && currentStepper!.color) {
      rootElt.style.backgroundColor = currentStepper!.color?.cssColor;
    }
    this.render();
    e.preventDefault();
  };

  private generatePanningGroup() {
    const panningGroup = document.createElement("div");
    const panningTitle = document.createElement("span");
    this.panningRange = document.createElement("input");
    this.panningValue = document.createElement("span");
    panningTitle.textContent = "panning";
    this.panningRange.type = "range";
    this.panningRange.value = "0";
    this.panningRange.min = "-1";
    this.panningRange.max = "1";
    this.panningRange.step = "0.01";
    this.panningRange.id = "panning-range";
    this.panningValue.textContent = this.panningRange.value;
    this.panningValue.id = "panning-value";
    panningGroup.classList.add("effect-group");
    panningGroup.appendChild(panningTitle);
    panningGroup.appendChild(this.panningRange);
    panningGroup.appendChild(this.panningValue);
    return panningGroup;
  }

  private generateVolumeGroup() {
    // VOLUME
    const volumeGroup = document.createElement("div");
    const volumeTitle = document.createElement("span");
    this.volumeRange = document.createElement("input");
    this.volumeValue = document.createElement("span");
    this.volumeValue.id = "volume-value";
    this.volumeRange.type = "range";
    this.volumeRange.min = "-40";
    this.volumeRange.value = "1";
    this.volumeValue.textContent = "1";
    this.volumeRange.max = "40";
    this.volumeRange.step = "0.1";
    volumeTitle.textContent = "volume";
    this.volumeRange.id = "stepper-volume-range";
    volumeGroup.classList.add("effect-group");
    volumeGroup.appendChild(volumeTitle);
    volumeGroup.appendChild(this.volumeRange);
    volumeGroup.appendChild(this.volumeValue);
    return volumeGroup;
  }

  private getEffectValues(
    name: EffectNameType
  ): Tone.ToneAudioNodeOptions | undefined {
    const effects = this.getSelectedStepper()?.track?.effects;
    const effect = effects?.find((e) => e.name === name)?.node.get();
    return effect;
  }
}

export default SoundPanel;
