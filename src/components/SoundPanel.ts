import type Stepper from "./Stepper";
import PanelSection from "./PanelSection/PanelSection";
import type { FeedbackDelayOptions, ReverbOptions } from "tone";
import State from "../state/State";
import type { StepperIdType } from "../state/state.types";
import Fader from "./Fader/Fader";
import type { PitchOptions } from "../types";
import { DEFAULT_STEPPER_BORDER_COLOR } from "../state/state.constants";

const rootElt = document.getElementById("top-panel");
const stepperElements = document.getElementsByClassName("stepper");
const stepperControlElements =
  document.getElementsByClassName("stepper-controls");

class SoundPanel {
  selectedStepper = State.getSelectedStepperId().toString();
  steppers: Stepper[] = [];
  element?: HTMLDivElement;
  panningRange?: HTMLInputElement;
  volumeRange?: HTMLInputElement;
  delayWetRange?: HTMLInputElement;
  delayFeedbackRange?: HTMLInputElement;
  delayTimeRange?: HTMLInputElement;
  panningValue?: HTMLSpanElement;
  volumeValue?: HTMLSpanElement;
  sampleNameElt?: HTMLSpanElement;
  sampleDetailsSection?: HTMLDivElement;

  constructor({ steppers }: { steppers: Stepper[] }) {
    this.steppers = steppers;
    this.element = document.createElement("div");
    this.element.id = "sound-panel";
    rootElt!.appendChild(this.element);
    this.initialize();
    this.initializeEvents();
    this.render();
    this.updatePanelColor();
  }

  private render() {
    this.sampleNameElt = document.getElementById(
      "sample-name",
    ) as HTMLSpanElement;
    const stepper = this.getSelectedStepper() as Stepper;
    this.sampleNameElt!.textContent = stepper.sampleName;
    this.setBackground();
  }

  private setBackground() {
    const currentStepper = this.getSelectedStepper();
    this.sampleNameElt!.style.color = currentStepper!.color?.cssColor as string;
    const currentStepperControlsElt = currentStepper?.controls
      ?.element as HTMLDivElement;
    currentStepperControlsElt.dataset["selected"] = "on";
    currentStepperControlsElt.style.borderColor = currentStepper!.color
      ?.cssColor as string;
  }

  private initialize() {
    this.sampleDetailsSection = document.createElement("div");
    this.sampleDetailsSection.classList.add("sample-details");
    const nameGroup = document.createElement("div");
    const nameValueSpan = document.createElement("span");
    nameValueSpan.id = "sample-name";

    nameGroup.appendChild(nameValueSpan);
    this.sampleDetailsSection.appendChild(nameGroup);
    this.sampleDetailsSection.appendChild(this.generateVolumeGroup());
    this.sampleDetailsSection.appendChild(this.generatePanningGroup());
    this.element?.appendChild(this.sampleDetailsSection);
    new PanelSection({
      title: "delay",
      settings: [
        {
          effectName: "delay",
          label: "wet",
          settingName: "wet",
          inputType: "knob",
          min: 0,
          max: 1,
          value: (
            State.getEffect({
              trackId: parseInt(this.selectedStepper) as StepperIdType,
              name: "delay",
            })?.value as FeedbackDelayOptions
          ).wet,
          onChange: this.handleDelayChange,
        },
        {
          effectName: "delay",
          label: "feedback",
          settingName: "feedback",
          inputType: "knob",
          min: 0,
          max: 1,
          value: (
            State.getEffect({
              trackId: parseInt(this.selectedStepper) as StepperIdType,
              name: "delay",
            })?.value as FeedbackDelayOptions
          ).feedback,
          onChange: this.handleDelayChange,
        },
        {
          effectName: "delay",
          label: "time",
          settingName: "delayTime",
          inputType: "knob",
          min: 0,
          max: 1,
          value: (
            State.getEffect({
              trackId: parseInt(this.selectedStepper) as StepperIdType,
              name: "delay",
            })?.value as FeedbackDelayOptions
          ).delayTime.valueOf() as number,
          onChange: this.handleDelayChange,
        },
      ],
      parentElt: this.element as HTMLDivElement,
    });
    new PanelSection({
      title: "reverb",
      settings: [
        {
          effectName: "reverb",
          label: "wet",
          settingName: "wet",
          inputType: "knob",
          min: 0,
          max: 1,
          value: (
            State.getEffect({
              trackId: parseInt(this.selectedStepper) as StepperIdType,
              name: "reverb",
            })?.value as ReverbOptions
          ).wet,
          onChange: this.handleReverbChange,
        },
        {
          effectName: "reverb",
          label: "decay",
          settingName: "decay",
          inputType: "knob",
          min: 0.01,
          max: 10,
          value: (
            State.getEffect({
              trackId: parseInt(this.selectedStepper) as StepperIdType,
              name: "reverb",
            })?.value as ReverbOptions
          ).decay,
          onChange: this.handleReverbChange,
        },
        {
          effectName: "reverb",
          label: "predelay",
          settingName: "preDelay",
          inputType: "knob",
          min: 0,
          max: 6,
          value: (
            State.getEffect({
              trackId: parseInt(this.selectedStepper) as StepperIdType,
              name: "reverb",
            })?.value as ReverbOptions
          ).preDelay,
          onChange: this.handleReverbChange,
        },
      ],
      parentElt: this.element as HTMLDivElement,
    });

    new PanelSection({
      title: "pitch",
      settings: [
        {
          effectName: "pitch",
          label: "",
          settingName: "pitch",
          inputType: "knob",
          min: -3,
          max: 3,
          value: (
            State.getEffect({
              trackId: parseInt(this.selectedStepper) as StepperIdType,
              name: "pitch",
            })?.value as PitchOptions
          ).pitch,
          onChange: this.handlePitchChange,
        },
      ],
      parentElt: this.element as HTMLDivElement,
    });
  }

  private initializeEvents() {
    for (const elt of [...stepperControlElements, ...stepperElements]) {
      elt.addEventListener("click", () =>
        this.handleStepperSelection(elt as HTMLDivElement),
      );
    }
  }

  private handleVolumeChange = (e: Event) => {
    console.log("handleVolumeChange");
    const target = e.target as HTMLInputElement;
    State.effectUpdateSubject.next({
      name: "volume",
      stepperId: this.selectedStepper,
      value: { volume: parseFloat(target.value) },
    });
    this.render();
  };

  private handlePanningChange = (e: Event) => {
    console.log("handlePanningChange");
    const target = e.target as HTMLInputElement;
    State.effectUpdateSubject.next({
      name: "panning",
      stepperId: this.selectedStepper,
      value: { pan: parseFloat(target.value) },
    });
    this.render();
  };

  private handleDelayChange = (value: string, name: string) => {
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
    State.effectUpdateSubject.next({
      name: "delay",
      stepperId: this.selectedStepper,
      value: updateValue,
    });
    this.render();
  };

  private handleReverbChange = (value: string, name: string) => {
    const rangeValue = parseFloat(value);
    const updateValue: { preDelay?: number; wet?: number; decay?: number } = {};
    switch (name) {
      case "decay":
        if (rangeValue > 0.001) updateValue.decay = rangeValue;
        else return;
        break;
      case "wet":
        updateValue.wet = rangeValue;
        break;
      case "preDelay":
        updateValue.preDelay = rangeValue;
        break;
    }
    State.effectUpdateSubject.next({
      name: "reverb",
      stepperId: this.selectedStepper,
      value: updateValue,
    });
    this.render();
  };

  private handlePitchChange = (value: string, name: string) => {
    const rangeValue = parseFloat(value);
    const updateValue: PitchOptions = { pitch: rangeValue };
    State.effectUpdateSubject.next({
      name: "pitch",
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

  private handleStepperSelection = (element: HTMLDivElement) => {
    const stepperId = element.dataset.stepperId as string;
    const previousStepper = this.getSelectedStepper();
    const previousStepperControlsElt = previousStepper!.controls
      ?.element as HTMLDivElement;
    previousStepperControlsElt.dataset["selected"] = "off";
    previousStepperControlsElt.style.borderColor = DEFAULT_STEPPER_BORDER_COLOR;
    this.selectedStepper = stepperId;
    State.currentStepperIdSubject.next(parseInt(stepperId) as StepperIdType);
    this.updatePanelColor();
    this.render();
  };

  private updatePanelColor() {
    const currentStepper = this.getSelectedStepper();
    if (rootElt && currentStepper!.color) {
      this.sampleNameElt!.style.color = currentStepper!.color
        ?.cssColor as string;
      this.sampleDetailsSection!.style.borderColor = currentStepper!.color
        ?.cssColor as string;
      const effectSections = document.getElementsByClassName(
        "panel-section",
      ) as HTMLCollectionOf<HTMLDivElement>;
      rootElt.style.borderColor = currentStepper!.color?.cssColor as string;
      for (const section of effectSections) {
        section.style.borderColor = currentStepper!.color?.cssColor as string;
      }
    }
  }
  private generatePanningGroup() {
    const panning = State.getEffect({
      trackId: parseInt(this.selectedStepper) as StepperIdType,
      name: "panning",
    });
    const panningValue = panning?.value as { pan: number };
    const panningGroup = document.createElement("div");
    const panningTitle = document.createElement("span");
    this.panningRange = document.createElement("input");
    this.panningValue = document.createElement("span");
    panningTitle.textContent = "PANNING";
    this.panningValue.textContent = this.panningRange.value.toUpperCase();
    this.panningValue.id = "panning-value";
    this.panningRange = new Fader({
      initialValue: panningValue.pan as number,
      min: -1,
      max: 1,
      step: 0.01,
      fillColor: this.getColor(),
      id: "panning-range",
      matchStepperColor: true,
      labelElt: this.panningValue,
      onChange: this.handlePanningChange,
      getValueFn: (id: StepperIdType) => {
        const effect = State.getEffect({ trackId: id, name: "panning" })
          ?.value as { pan: number };
        return effect.pan.toString();
      },
    }).render();
    this.panningRange.classList.add("panel-range-input");
    panningGroup.classList.add("effect-group");
    panningGroup.appendChild(panningTitle);
    panningGroup.appendChild(this.panningRange);
    panningGroup.appendChild(this.panningValue);
    return panningGroup;
  }

  private generateVolumeGroup() {
    // VOLUME
    const volume = State.getEffect({
      trackId: parseInt(this.selectedStepper) as StepperIdType,
      name: "volume",
    });
    const volumeValue = volume?.value as { volume: number };
    const volumeGroup = document.createElement("div");
    const volumeTitle = document.createElement("span");
    this.volumeValue = document.createElement("span");
    this.volumeValue.id = "volume-value";
    this.volumeRange = new Fader({
      variant: "positive",
      id: "volume-range",
      initialValue: volumeValue?.volume,
      min: -40,
      max: 40,
      step: 0.1,
      matchStepperColor: true,
      fillColor: this.getColor(),
      labelElt: this.volumeValue,
      onChange: this.handleVolumeChange,
      getValueFn: (id: StepperIdType) => {
        const effect = State.getEffect({ trackId: id, name: "volume" });
        const value = effect?.value as { volume: number };
        return value.volume.toString();
      },
    }).render();
    volumeTitle.textContent = "VOLUME";
    this.volumeRange.id = "stepper-volume-range";
    volumeGroup.classList.add("effect-group");
    volumeGroup.appendChild(volumeTitle);
    volumeGroup.appendChild(this.volumeRange);
    volumeGroup.appendChild(this.volumeValue);
    return volumeGroup;
  }

  private getColor() {
    return (this.getSelectedStepper() as Stepper).color?.cssColor;
  }
}

export default SoundPanel;
