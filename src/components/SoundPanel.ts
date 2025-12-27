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
    sampleDetailsSection.id = "sample-details";
    const nameGroup = document.createElement("div");
    // const nameTitleSpan = document.createElement("span");
    const nameValueSpan = document.createElement("span");
    const volumeGroup = document.createElement("div");
    const volumeTitle = document.createElement("span");
    const volumeRange = document.createElement("input");
    volumeRange.type = "range";
    volumeRange.min = "0";
    volumeRange.max = "2";
    volumeRange.step = "0.01";
    nameValueSpan.id = "sample-name";
    // nameTitleSpan.textContent = "sample: ";
    volumeTitle.textContent = "volume";
    volumeRange.id = "volume-range";
    volumeGroup.appendChild(volumeTitle);
    volumeGroup.appendChild(volumeRange);
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
  }

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
