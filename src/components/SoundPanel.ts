import type Stepper from "./Stepper";
import type { SoundSettings } from "./types";
const rootElt = document.getElementById("top-panel");
const stepperControlElements =
  document.getElementsByClassName("stepper-controls");

class SoundPanel {
  selectedStepper = "0";
  steppers: Stepper[] = [];
  element?: HTMLDivElement;

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
    const volumeValueElt = document.getElementById("volume-value");
    const panningValueElt = document.getElementById("panning-value");
    const panningRangeElt = document.getElementById(
      "panning-range"
    ) as HTMLInputElement;
    const volumeRangeElt = document.getElementById(
      "volume-range"
    ) as HTMLInputElement;
    const stepper = this.getSelectedStepper() as Stepper;
    sampleNameElt!.textContent = stepper.sampleName;
    if (rootElt) {
      rootElt.style.backgroundColor = stepper.color?.cssColor as string;
    }
    const currentStepper = this.getSelectedStepper();
    const currentStepperControlsElt = currentStepper?.controls
      ?.element as HTMLDivElement;
    currentStepperControlsElt.dataset["selected"] = "on";
    currentStepperControlsElt.style.borderLeft = `solid .3rem ${
      currentStepper!.color?.cssColor
    }`;
    const volume = currentStepper?.getAudioSetting("volume") as SoundSettings;
    const panning = currentStepper?.getAudioSetting("panning") as SoundSettings;
    const volumeAsGain = volume.node as GainNode;
    const panningAsPanner = panning.node as StereoPannerNode;
    const volumeAsString = volumeAsGain.gain.value.toFixed(2);
    const panningAsString = panningAsPanner.pan.value.toFixed(2);
    volumeValueElt!.textContent = volumeAsString;
    panningValueElt!.textContent = panningAsString;
    panningRangeElt.value = panningAsString;
    volumeRangeElt.value = volumeAsString;
  }

  private initialize() {
    const sampleDetailsSection = document.createElement("div");
    sampleDetailsSection.classList.add("sample-details");
    const nameGroup = document.createElement("div");
    const nameValueSpan = document.createElement("span");
    const volumeGroup = document.createElement("div");
    const volumeTitle = document.createElement("span");
    const volumeRange = document.createElement("input");
    const volumeValue = document.createElement("span");
    const panningGroup = document.createElement("div");
    const panningTitle = document.createElement("span");
    const panningRange = document.createElement("input");
    const panningValue = document.createElement("span");

    volumeValue.id = "volume-value";
    volumeRange.type = "range";
    volumeRange.min = "0";
    volumeRange.value = "1";
    volumeValue.textContent = "1";
    volumeRange.max = "2";
    volumeRange.step = "0.1";
    nameValueSpan.id = "sample-name";
    volumeTitle.textContent = "volume";
    volumeRange.id = "stepper-volume-range";

    panningTitle.textContent = "panning";
    panningRange.type = "range";
    panningRange.value = "0";
    panningRange.min = "-1";
    panningRange.max = "1";
    panningRange.step = "0.01";
    panningRange.id = "panning-range";
    panningValue.textContent = panningRange.value;
    panningValue.id = "panning-value";

    volumeGroup.classList.add("effect-group");
    panningGroup.classList.add("effect-group");

    volumeGroup.appendChild(volumeTitle);
    volumeGroup.appendChild(volumeRange);
    volumeGroup.appendChild(volumeValue);
    panningGroup.appendChild(panningTitle);
    panningGroup.appendChild(panningRange);
    panningGroup.appendChild(panningValue);
    nameGroup.appendChild(nameValueSpan);
    sampleDetailsSection.appendChild(nameGroup);
    sampleDetailsSection.appendChild(volumeGroup);
    sampleDetailsSection.appendChild(panningGroup);
    this.element?.appendChild(sampleDetailsSection);
  }

  private initializeEvents() {
    for (const stepperCtrl of stepperControlElements) {
      if (stepperCtrl)
        stepperCtrl.addEventListener("click", this.handleStepperSelection);
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
    console.log("handleVolumeChange");
    const target = e.target as HTMLInputElement;
    const stepper = this.getSelectedStepper();
    const volumeSetting = stepper?.soundSettings.find(
      (s) => s.name === "volume"
    );
    const volumeNode = volumeSetting?.node as GainNode;
    volumeNode.gain.value = parseFloat(target.value);
    const volumeValue = document.getElementById("volume-value");
    volumeValue!.textContent = target.value;
  };

  private handlePanningChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const stepper = this.getSelectedStepper();
    const setting = stepper?.soundSettings.find((s) => s.name === "panning");
    const pannerNode = setting?.node as StereoPannerNode;
    pannerNode.pan.value = parseFloat(target.value);
    const panningValueElt = document.getElementById("panning-value");
    panningValueElt!.textContent = target.value;
    console.log("PANNING CHANGE ", pannerNode.pan.value);
  };

  private getSelectedStepper() {
    const selected = this.steppers.find(
      (s) => s.id?.toString() === this.selectedStepper
    );
    // console.log("selected: ", selected);
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
}

export default SoundPanel;
