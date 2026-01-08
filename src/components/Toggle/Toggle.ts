type ToggleOptions = {
  text: string;
  checked?: boolean;
  onClick: (checked: boolean) => void;
  color: string;
};

const CHECKED_CLASS = "toggle-checked";

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
    this.render();
  }

  private toggleStyle() {
    if (this.checked) {
      this.rootElt.style.borderColor = this.color;
      this.labelElt.style.color = this.color;
      this.rootElt.classList.add(CHECKED_CLASS);
    } else {
      this.rootElt.classList.remove(CHECKED_CLASS);
      this.labelElt.style.color = "";
      this.rootElt.style.borderColor = "";
    }
  }

  private toggle = () => {
    this.checked = !this.checked;
    this.toggleStyle();
    this.onClick?.(this.checked);
  };

  private render(): HTMLDivElement {
    this.rootElt.className = "toggle";
    this.buttonElt.className = "toggle-btn";
    this.labelElt.className = "toggle-label";
    this.labelElt.textContent = this.text;
    this.rootElt.style.borderColor = this.color;
    if (this.checked) {
      this.labelElt.style.color = this.color;
      this.rootElt.classList.add(CHECKED_CLASS);
    }
    this.rootElt.appendChild(this.buttonElt);
    this.buttonElt.appendChild(this.labelElt);
    return this.rootElt;
  }

  getElement() {
    return this.rootElt;
  }
}

export default Toggle;
