import Knob from "../Knob/Knob";

type PanelSetting = {
  label: string;
  name: string;
  inputType: "knob";
  min: number;
  max: number;
  onChange: (value: string, name: string) => void;
  parentElt?: HTMLDivElement;
  size?: number;
  value?: number;
};

type PanelSectionOptions = {
  parentElt: HTMLDivElement;
  title: string;
  settings: PanelSetting[];
};

class PanelSection {
  /** Element the section is appended to at creation */
  parentElt?: HTMLDivElement;
  containerElt?: HTMLDivElement;
  titleElt?: HTMLDivElement;
  title: string = "section title";
  settings: PanelSetting[];

  constructor({ parentElt, title, settings }: PanelSectionOptions) {
    this.parentElt = parentElt;
    this.title = title;
    this.title = title;
    this.settings = settings;
    this.render();
  }

  private renderControls(): HTMLDivElement {
    const controls = document.createElement("div");
    controls.classList.add("panel-section-controls");
    for (const s of this.settings) {
      switch (s.inputType) {
        case "knob":
          this.renderKnob({ ...s, parentElt: controls });
      }
    }
    return controls;
  }

  private renderKnob({
    label,
    onChange,
    parentElt,
    size = 3.4,
    value = 0,
    min = 0,
    max = 1,
    name,
  }: PanelSetting) {
    new Knob({
      label: label,
      id: `${this.title}-${label}`,
      value,
      min,
      max,
      fillColor: "beige",
      onChange,
      size: size || 3,
      name,
      parentElt: parentElt as HTMLDivElement,
    });
  }

  private render() {
    // BASIC CONTENT
    this.containerElt = document.createElement("div");
    this.containerElt.classList.add("panel-section");
    this.titleElt = document.createElement("div");
    this.titleElt.classList.add("panel-section-title");
    this.titleElt.textContent = this.title;

    this.containerElt.appendChild(this.titleElt);
    this.containerElt.appendChild(this.renderControls());
    // SETTINGS
    this.parentElt?.appendChild(this.containerElt);
  }
}

export default PanelSection;
