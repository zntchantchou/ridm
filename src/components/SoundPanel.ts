import type { Subject } from "rxjs";
import type Stepper from "./Stepper";
import * as Tone from "tone";
import type { EffectNameType, EffectUpdate } from "../types";

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
    sampleDetailsSection.appendChild(this.generateDelayGroup());
    this.element?.appendChild(sampleDetailsSection);
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

    const delayTimeRange = document.getElementById(
      "delay-time-range"
    ) as HTMLInputElement;

    const delayFeedbackRange = document.getElementById(
      "delay-feedback-range"
    ) as HTMLInputElement;
    const delayWetRange = document.getElementById(
      "delay-wet-range"
    ) as HTMLInputElement;

    [delayTimeRange, delayFeedbackRange, delayWetRange].forEach((elt) =>
      elt.addEventListener("change", this.handleDelayChange)
    );
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
    // const volumeValue = document.getElementById("volume-value");
    // volumeValue!.textContent = target.value;
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

  private handleDelayChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    console.log("TARGET-ID ", target.id);
    const rangeValue = parseFloat(target.value);
    const updateValue: { feedback?: number; wet?: number; delayTime?: number } =
      {};

    if (target.id.includes("feedback")) {
      updateValue.feedback = rangeValue;
    } else if (target.id.includes("wet")) {
      updateValue.wet = rangeValue;
    } else {
      updateValue.delayTime = rangeValue;
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
      console.log("STEPPER ID: ", s.id, this.selectedStepper);
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

  private generateDelayGroup() {
    // DELAY
    const delayGroup = document.createElement("div");
    const delayTimeTitle = document.createElement("span");
    const delayWetTitle = document.createElement("span");
    const delayFeedbackTitle = document.createElement("span");
    this.delayFeedbackRange = document.createElement("input");
    const delayFeedbackValue = document.createElement("span");
    this.delayTimeRange = document.createElement("input");
    const delayTimeValue = document.createElement("span");
    this.delayWetRange = document.createElement("input");
    const delayWetValue = document.createElement("span");
    delayTimeTitle.textContent = "delay";
    // TIME
    this.delayTimeRange.type = "range";
    this.delayTimeRange.value = "0";
    this.delayTimeRange.min = "0";
    this.delayTimeRange.max = "1";
    this.delayTimeRange.step = "0.01";
    this.delayTimeRange.id = "delay-time-range";
    delayTimeValue.textContent = this.delayTimeRange.value;
    delayTimeValue.id = "delay-time-value";
    // FEEDBACK
    delayFeedbackTitle.textContent = "delay feedback";
    this.delayFeedbackRange.type = "range";
    this.delayFeedbackRange.value = "0";
    this.delayFeedbackRange.min = "0";
    this.delayFeedbackRange.max = "1";
    this.delayFeedbackRange.step = "0.01";
    this.delayFeedbackRange.id = "delay-feedback-range";
    delayFeedbackValue.textContent = this.delayFeedbackRange.value;
    delayFeedbackValue.id = "delay-feedback-value";
    // WET
    delayWetTitle.textContent = "delay wet";
    this.delayWetRange.type = "range";
    this.delayWetRange.value = "0";
    this.delayWetRange.min = "0";
    this.delayWetRange.max = "1";
    this.delayWetRange.step = "0.01";
    this.delayWetRange.id = "delay-wet-range";
    delayWetValue.textContent = this.delayWetRange.value;
    delayWetValue.id = "delay-wet-value";

    delayGroup.classList.add("effect-group");
    delayGroup.appendChild(delayTimeTitle);
    delayGroup.appendChild(this.delayTimeRange);
    delayGroup.appendChild(delayTimeValue);
    delayGroup.appendChild(delayFeedbackTitle);
    delayGroup.appendChild(this.delayFeedbackRange);
    delayGroup.appendChild(delayFeedbackValue);
    delayGroup.appendChild(delayWetTitle);
    delayGroup.appendChild(this.delayWetRange);
    delayGroup.appendChild(delayWetValue);
    return delayGroup;
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
