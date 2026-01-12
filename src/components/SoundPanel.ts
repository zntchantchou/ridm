import type Stepper from "./Stepper";
import type { EffectNameType, EffectValue } from "../types";
import PanelSection from "./PanelSection/PanelSection";
import type {
  PitchShiftOptions,
  FeedbackDelayOptions,
  ReverbOptions,
} from "tone";
import State from "../state/State";
import type { StepperIdType } from "../state/state.types";

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

  constructor({ steppers }: { steppers: Stepper[] }) {
    this.steppers = steppers;
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
    const volume = State.getEffect({
      trackId: parseInt(this.selectedStepper) as StepperIdType,
      name: "volume",
    });
    const panning = State.getEffect({
      trackId: parseInt(this.selectedStepper) as StepperIdType,
      name: "panning",
    });
    const volumeValue = volume?.value as { volume: number };
    const panningValue = panning?.value as { pan: number };
    // VOLUME
    if (volumeValue) {
      this!.volumeRange!.value = volumeValue?.volume.toString() as string;
      this!.volumeValue!.textContent = volumeValue?.volume.toString() as string;
    }
    if (panningValue) {
      this!.panningRange!.value = panningValue?.pan.toString() as string;
      this!.panningValue!.textContent = panningValue?.pan.toString() as string;
    }
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
    currentStepperControlsElt.style.borderColor = currentStepper!.color
      ?.cssColor as string;
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
    this.element?.appendChild(sampleDetailsSection);
    const volume = State.getEffect({
      trackId: parseInt(this.selectedStepper) as StepperIdType,
      name: "volume",
    });
    const panning = State.getEffect({
      trackId: parseInt(this.selectedStepper) as StepperIdType,
      name: "panning",
    });
    const volumeValue = volume?.value as { volume: number };
    const panningValue = panning?.value as { pan: number };
    // VOLUME
    if (volumeValue) {
      this!.volumeRange!.value = volumeValue?.volume.toString() as string;
      this!.volumeValue!.textContent = volumeValue?.volume.toString() as string;
    }
    if (panningValue) {
      this!.panningRange!.value = panningValue?.pan.toString() as string;
      this!.panningValue!.textContent = panningValue?.pan.toString() as string;
    }
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
          label: "wet",
          settingName: "wet",
          inputType: "knob",
          min: 0,
          max: 1,
          value: (
            State.getEffect({
              trackId: parseInt(this.selectedStepper) as StepperIdType,
              name: "pitch",
            })?.value as PitchShiftOptions
          ).wet,
          onChange: this.handlePitchChange,
        },
        {
          effectName: "pitch",
          label: "interval",
          settingName: "pitch",
          inputType: "knob",
          min: -8,
          max: 8,
          value: (
            State.getEffect({
              trackId: parseInt(this.selectedStepper) as StepperIdType,
              name: "pitch",
            })?.value as PitchShiftOptions
          ).pitch,
          onChange: this.handlePitchChange,
        },
        {
          effectName: "pitch",
          label: "windowSize",
          settingName: "windowSize",
          inputType: "knob",
          min: 0.1,
          max: 1,
          value: (
            State.getEffect({
              trackId: parseInt(this.selectedStepper) as StepperIdType,
              name: "pitch",
            })?.value as PitchShiftOptions
          ).windowSize,
          onChange: this.handlePitchChange,
        },
      ],
      parentElt: this.element as HTMLDivElement,
    });
  }

  private initializeEvents() {
    for (const elt of [...stepperControlElements, ...stepperElements]) {
      elt.addEventListener("click", () =>
        this.handleStepperSelection(elt as HTMLDivElement)
      );
    }

    const volumeRangeElt = document.getElementById("stepper-volume-range");
    volumeRangeElt?.addEventListener("change", this.handleVolumeChange);

    const pannerRangeElt = document.getElementById(
      "panning-range"
    ) as HTMLInputElement;
    pannerRangeElt?.addEventListener("change", this.handlePanningChange);
  }

  private handleVolumeChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    State.effectUpdateSubject.next({
      name: "volume",
      stepperId: this.selectedStepper,
      value: { volume: parseFloat(target.value) },
    });
    this.render();
  };

  private handlePanningChange = (e: Event) => {
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
    const updateValue: { pitch?: number; wet?: number; windowSize?: number } =
      {};
    switch (name) {
      case "pitch":
        updateValue.pitch = rangeValue;
        break;
      case "wet":
        updateValue.wet = rangeValue;
        break;
      case "windowSize":
        updateValue.windowSize = rangeValue;
        break;
    }

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
    previousStepperControlsElt.style.borderColor = "rgb(80, 80, 80)";
    this.selectedStepper = stepperId;
    State.currentStepperId.next(parseInt(stepperId) as StepperIdType);
    const currentStepper = this.getSelectedStepper();
    if (rootElt && currentStepper!.color) {
      rootElt.style.backgroundColor = currentStepper!.color?.cssColor;
    }
    this.render();
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
    this.panningRange.classList.add("panel-range-input");
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
    this.volumeRange.classList.add("panel-range-input");
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

  private getEffectValues(name: EffectNameType): EffectValue | undefined {
    const effects = this.getSelectedStepper()?.track?.effects;
    const effect = effects?.find((e) => e.name === name)?.node.get();
    return effect;
  }
}

export default SoundPanel;
