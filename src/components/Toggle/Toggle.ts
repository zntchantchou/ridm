type ToggleOptions = {
  text: string;
  checked?: boolean;
  onClick: (checked: boolean) => void;
  color: string;
};

class Toggle {
  text: string;
  checked: boolean = false;
  rootElt: HTMLDivElement;
  buttonElt: HTMLButtonElement;
  labelElt: HTMLSpanElement;
  onClick: (checked: boolean) => void;
  color: string;

  constructor({ text, onClick, checked, color }: ToggleOptions) {
    this.color = color;
    this.text = text;
    this.onClick = onClick;
    this.checked = checked ?? false;
    this.rootElt = document.createElement("div");
    this.buttonElt = document.createElement("button");
    this.labelElt = document.createElement("span");
    this.buttonElt.addEventListener("click", this.toggle);
  }

  private toggleStyle() {
    this.checked = !this.checked;
    if (this.checked) {
      this.rootElt.style.borderColor = this.color;
      this.labelElt.style.color = this.color;
      this.rootElt.classList.add("toggle-checked");
    } else {
      this.rootElt.classList.remove("toggle-checked");
      this.labelElt.style.color = "";
      this.rootElt.style.borderColor = "";
    }
  }

  private toggle = () => {
    this.toggleStyle();
    this.onClick?.(this.checked);
  };

  render(): HTMLDivElement {
    this.rootElt.className = "toggle";
    this.buttonElt.className = "toggle-btn";
    this.labelElt.className = "toggle-label";
    this.labelElt.textContent = this.text;
    this.rootElt.style.borderColor = this.color;
    if (this.checked) {
      this.labelElt.style.color = this.color;
      this.rootElt.classList.add("toggle-checked");
    }
    this.rootElt.appendChild(this.buttonElt);
    this.buttonElt.appendChild(this.labelElt);
    return this.rootElt;
  }

  getElement(): HTMLDivElement {
    return this.rootElt;
  }
}

export default Toggle;
