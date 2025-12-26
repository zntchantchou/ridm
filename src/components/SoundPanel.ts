import type Stepper from "./Stepper";
const rootElt = document.getElementById("top-panel");
const stepperControlElements =
  document.getElementsByClassName("stepper-controls");

class SoundPanel {
  selectedStepper = "0";
  steppers: Stepper[] = [];

  constructor({ steppers }: { steppers: Stepper[] }) {
    this.steppers = steppers;
    this.render();
    for (const stepperCtrl of stepperControlElements) {
      if (stepperCtrl)
        stepperCtrl.addEventListener("click", this.handleStepperSelection);
    }
  }

  render() {
    const element = document.createElement("div");
    element.id = "sound-panel";
    if (rootElt) rootElt.appendChild(element);
  }

  private handleStepperSelection = (e: Event) => {
    console.log("HandleStepperSelection", e);
    const target = e?.target as HTMLDivElement;
    let stepperId = target.dataset.stepperId;
    if (stepperId === undefined) {
      stepperId = target.parentElement?.dataset.stepperId;
    }
    if (typeof stepperId === "string") {
      this.selectedStepper = stepperId;
    }
    if (!this.steppers.length) return;
    console.log("STEPPERS ", this.steppers);
    for (const stepper of this.steppers) {
      const stepperId = stepper?.id?.toString();
      const elt = stepper.controls?.element as HTMLDivElement;
      if (stepperId === this.selectedStepper) {
        elt.dataset["selected"] = "on";
        elt.style.border = `solid 2px ${stepper.color?.cssColor}`;
        console.log("ROOT ELT", rootElt);
        if (rootElt && stepper.color) {
          rootElt.style.backgroundColor = stepper.color?.cssColor;
          continue;
        }
      }
      (stepper.element as HTMLDivElement).dataset["selected"] = "off";
      elt.style.borderColor = "transparent";
      e.preventDefault();
    }
  };
}

export default SoundPanel;
