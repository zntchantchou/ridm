import type Stepper from "./Stepper";
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
    const stepper = this.getSelectedStepper() as Stepper;
    sampleNameElt!.textContent = stepper.sampleName;
    if (rootElt) {
      rootElt.style.backgroundColor = stepper.color?.cssColor as string;
    }
  }

  private initialize() {
    const sampleDetailsSection = document.createElement("div");
    // sampleDetailsSection.id = "sample-details";
    sampleDetailsSection.classList.add("sample-details");
    const nameGroup = document.createElement("div");
    // const nameTitleSpan = document.createElement("span");
    const nameValueSpan = document.createElement("span");
    const volumeGroup = document.createElement("div");
    const volumeTitle = document.createElement("span");
    const volumeRange = document.createElement("input");
    const volumeValue = document.createElement("span");
    volumeValue.id = "volume-value";
    volumeRange.type = "range";
    volumeRange.min = "0";
    volumeRange.value = "1";
    volumeValue.textContent = "1";
    volumeRange.max = "2";
    volumeRange.step = "0.1";
    nameValueSpan.id = "sample-name";
    // nameTitleSpan.textContent = "sample: ";
    volumeTitle.textContent = "volume";
    volumeRange.id = "stepper-volume-range";
    volumeGroup.appendChild(volumeTitle);
    volumeGroup.appendChild(volumeRange);
    volumeGroup.appendChild(volumeValue);
    // nameTitleSpan.textContent = "sample: ";
    // nameGroup.appendChild(nameTitleSpan);
    nameGroup.appendChild(nameValueSpan);
    sampleDetailsSection.appendChild(nameGroup);
    sampleDetailsSection.appendChild(volumeGroup);
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
    console.log("UPDATE VOLUME VALUE ", volumeNode);
    console.log("UPDATE VOLUME Stepper ", stepper);
  };

  private getSelectedStepper() {
    const selected = this.steppers.find(
      (s) => s.id?.toString() === this.selectedStepper
    );
    console.log("selected: ", selected);
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
    const currentStepperControlsElt = currentStepper?.controls
      ?.element as HTMLDivElement;
    currentStepperControlsElt.dataset["selected"] = "on";
    currentStepperControlsElt.style.border = `solid 2px ${
      currentStepper!.color?.cssColor
    }`;
    if (rootElt && currentStepper!.color) {
      rootElt.style.backgroundColor = currentStepper!.color?.cssColor;
    }
    this.render();
    e.preventDefault();
  };
}

export default SoundPanel;
