import { fromEvent, Observable, Subscription, throttleTime } from "rxjs";

export type KnobOptions = {
  label: string;
  id: string;
  value: number;
  onChange: (value: string, name: string) => void;
  min: number;
  max: number;
  fillColor: string;
  name: string;
  /** size in rem */
  size: number;
  parentElt: HTMLDivElement;
};

class Knob {
  label;
  id;
  value;
  onChange;
  min;
  max;
  initialized = false;
  rootElt?: HTMLDivElement;
  valueContainer?: HTMLDivElement;
  valueElt?: HTMLSpanElement;
  labelContainer?: HTMLDivElement;
  labelElt?: HTMLSpanElement;
  parentElt?: HTMLDivElement;
  knobElt?: HTMLDivElement;
  ringElt?: HTMLDivElement;
  ringFillElt?: HTMLDivElement;
  knobIndicatorElt?: HTMLDivElement;
  knobIndicatorContainerElt?: HTMLDivElement;
  knobContainerElt?: HTMLDivElement;
  moveListener?: number;
  clickListener?: number;
  releaseListener?: number;
  size: number;
  dragObs?: Observable<Event>;
  dragSubscription?: Subscription;
  valueUpdateSubscription?: Subscription;
  // VALUES
  startY = 0;
  name;
  currentY = 0;
  lastRotation = 0;
  maxRotation = 140;
  velocity = 1.5;
  fillColor = "blue";

  constructor({
    label,
    id,
    value = 0,
    onChange,
    size,
    min,
    max,
    fillColor,
    parentElt,
    name,
  }: KnobOptions) {
    this.label = label;
    this.value = value;
    this.name = name;
    this.min = min;
    this.max = max;
    this.id = id;
    this.size = size;
    this.fillColor = fillColor;
    this.onChange = onChange;
    this.label = label;
    this.parentElt = parentElt;
    if (this.min >= 0) {
      this.maxRotation = this.maxRotation * 2;
    }
    this.render();
    this.initializeEvents();
  }
  // call in constructor and onUpdate
  private render() {
    this.rootElt = document.createElement("div");
    this.rootElt.classList.add("knob-root");
    this.valueContainer = document.createElement("div");
    this.valueContainer.classList.add("knob-value-container");
    this.valueElt = document.createElement("span");
    this.valueElt.classList.add("knob-value");
    this.labelContainer = document.createElement("div");
    this.labelContainer.classList.add("knob-label-container");
    this.labelElt = document.createElement("span");
    this.labelElt.classList.add("knob-label");
    this.labelElt.textContent = this.label;
    this.knobContainerElt = document.createElement("div");
    this.knobContainerElt.id = this.id;
    this.knobContainerElt.classList.add("knob-container");
    this.knobContainerElt.style.width = `${this.size}rem`;
    this.knobContainerElt.style.height = `${this.size}rem`;
    this.ringElt = document.createElement("div");
    this.ringElt.classList.add("ring");
    this.ringFillElt = document.createElement("div");
    this.ringFillElt.classList.add("ring-fill");
    const spaceElt = document.createElement("div");
    spaceElt.classList.add("space");
    this.knobElt = document.createElement("div");
    this.knobElt.classList.add("knob");
    this.knobIndicatorContainerElt = document.createElement("div");
    this.knobIndicatorContainerElt.classList.add("knob-indicator-container");
    this.knobIndicatorElt = document.createElement("div");
    this.knobIndicatorElt.classList.add("knob-indicator");
    this.knobIndicatorContainerElt.appendChild(this.knobIndicatorElt);
    this.knobElt.appendChild(this.knobIndicatorContainerElt);
    this.knobContainerElt.appendChild(this.ringElt);
    this.knobContainerElt.appendChild(this.ringFillElt);
    this.knobContainerElt.appendChild(spaceElt);
    this.knobContainerElt.appendChild(this.knobElt);
    this.valueContainer.appendChild(this.valueElt);
    this.labelContainer.appendChild(this.labelElt);
    this.rootElt.appendChild(this.labelContainer);
    this.rootElt.appendChild(this.knobContainerElt);
    this.rootElt.appendChild(this.valueContainer);
    this!.valueElt.textContent = this.getValue();
    this.parentElt?.appendChild(this.rootElt);
    this.updatePosition();
    this.initialized = true;
  }

  private initializeEvents() {
    this.knobIndicatorContainerElt?.addEventListener(
      "pointerdown",
      this.handleClick
    );
    this.dragObs = fromEvent(document, "pointermove");
  }

  private handleClick = (e: PointerEvent) => {
    document.addEventListener("pointermove", this.handleMove);
    document.addEventListener("pointerup", this.handleRelease);
    this.dragSubscription = this.dragObs
      ?.pipe(throttleTime(100))
      .subscribe(() => this.triggerUpdate()); // this actually updates the setting that this knob controls, hence throttling
    this.startY = e.clientY;
  };

  private triggerUpdate = () => {
    console.log("TRIGGER UPDATE ", this.getValue());
    this.onChange(this.getValue(), this.name);
  };

  private updatePosition() {
    const value = this.initialized ? parseFloat(this.getValue()) : this.value;
    const ratio = value ? value / this.max : value;
    const angle = this.maxRotation * ratio;
    const rotation = this.min >= 0 ? angle - this.maxRotation / 2 : angle;
    this.knobIndicatorContainerElt!.style.transform = `rotate(${rotation}deg)`;
    this.currentY = angle;
    this.updateRingColor();
  }

  private handleMove = ({ clientY }: PointerEvent) => {
    const delta = this.startY - clientY;
    this.currentY = this.lastRotation + delta * this.velocity; // This is the actual value
    if (this.currentY > this.maxRotation) {
      this.currentY = this.maxRotation; // return instead ?
    } else if (this.currentY < -this.maxRotation) {
      this.currentY = this.min < 0 ? -this.maxRotation : -this.maxRotation / 2;
    }
    this.updatePosition();
  };

  private updateRingColor() {
    const getBg = (startingAngle: number) =>
      `conic-gradient(${this.fillColor} ${startingAngle}deg, rgba(255,255,255,0.0) 0 360deg, ${this.fillColor} 0deg)`;
    if (this.min < 0) {
      if (this.currentY > 0) {
        // debugger;
        this.ringFillElt!.style.background = getBg(this.currentY);
        return;
      }
      this.ringFillElt!.style.background = `conic-gradient(${
        this.fillColor
      } 0deg, rgba(255,255,255,0.0) 0 ${360 + this.currentY}deg, ${
        this.fillColor
      } 0deg)`;
      return;
    }
    this.ringFillElt!.style.background = `conic-gradient(from ${
      -1 * (this.maxRotation / 2)
    }deg, ${this.fillColor} ${
      this.currentY
    }deg, rgba(255,255,255,0.0) 0 360deg, ${this.fillColor} 0deg)`;
    return;
  }

  private handleRelease = () => {
    console.log("HANDLE RELEASE ");
    this.lastRotation = this.currentY;
    if (this.valueElt) this.valueElt.textContent = this.getValue();
    this.dragSubscription?.unsubscribe();
    document.removeEventListener("pointermove", this.handleMove);
    document.removeEventListener("pointerup", this.handleRelease);
    this.triggerUpdate();
  };

  private getValue() {
    // ABSOLUTE
    if (!this.initialized) return this.value.toString();
    const valueUp = Math.abs((this.currentY / this.maxRotation) * this.max);
    const valueDown = -1 * (this.currentY / this.maxRotation) * this.min;
    if (this.currentY < 0) {
      return valueDown.toFixed(2);
    }
    return valueUp.toFixed(2);
  }
}

export default Knob;
