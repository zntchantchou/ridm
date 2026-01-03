import { fromEvent, Observable, Subscription, throttleTime } from "rxjs";

export type KnobOptions = {
  label: string;
  id: string;
  value: number;
  onChange: (value: string) => void;
  min: number;
  max: number;
  fillColor: string;
  /** size in rem */
  size: string;
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
  labelContainer?: HTMLDivElement;
  parentElt?: HTMLDivElement;
  labelElt?: HTMLSpanElement;
  knobElt?: HTMLDivElement;
  ringElt?: HTMLDivElement;
  ringFillElt?: HTMLDivElement;
  knobIndicatorElt?: HTMLDivElement;
  knobIndicatorContainerElt?: HTMLDivElement;
  knobContainerElt?: HTMLDivElement;
  moveListener?: number;
  clickListener?: number;
  releaseListener?: number;
  size: string;
  dragObs?: Observable<Event>;
  dragSubscription?: Subscription;
  valueUpdateSubscription?: Subscription;
  // VALUES
  startY = 0;
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
  }: KnobOptions) {
    this.label = label;
    this.value = value;
    this.min = min;
    this.id = id;
    this.max = max;
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
    this.labelContainer = document.createElement("div");
    this.labelContainer.classList.add("knob-label-container");
    this.labelElt = document.createElement("span");
    this.labelElt.classList.add("knob-label");
    this.knobContainerElt = document.createElement("div");
    this.knobContainerElt.id = this.id;
    this.knobContainerElt.classList.add("knob-container");
    this.knobContainerElt.style.width = `${this.size}rem`;
    this.knobContainerElt.style.height = `${this.size}rem`;
    this.rootElt.style.width = `${this.size}rem`;
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
    this.labelContainer.appendChild(this.labelElt);
    this.rootElt.appendChild(this.knobContainerElt);
    this.rootElt.appendChild(this.labelContainer);
    this!.labelElt.textContent = this.getValue();
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
    this.onChange(this.getValue());
  };

  private updatePosition() {
    const value = this.initialized ? parseFloat(this.getValue()) : this.value;
    const ratio = value / this.max;
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
        this.ringFillElt!.style.background = getBg(this.currentY);
        return;
      }
      this.ringFillElt!.style.background = getBg(360 + this.currentY);
      return;
    }
    this.ringFillElt!.style.background = `conic-gradient(from ${
      -1 * (this.maxRotation / 2)
    }deg, ${this.fillColor} ${
      this.currentY
    }deg, rgba(255,255,255,0.0) 0 360deg, ${this.fillColor} 0deg)`;
    return;
  }

  private handleRelease = (e: Event) => {
    document.removeEventListener("pointermove", this.handleMove);
    document.removeEventListener("pointerup", this.handleRelease);
    this.lastRotation = this.currentY;
    this.dragSubscription?.unsubscribe();
    if (this.labelElt) this.labelElt.textContent = this.getValue();
  };

  private getValue() {
    // ABSOLUTE
    if (!this.initialized) return this.value.toString();
    const valueUp = (this.currentY / this.maxRotation) * this.max;
    const valueDown = -((this.currentY / this.maxRotation) * this.min);
    if (this.min < 0) {
      if (this.currentY > 0) {
        return Math.abs(valueUp).toFixed(2);
      }
      if (this.currentY < 0) {
        return valueDown.toFixed(2);
      }
      return "0";
    }
    // POSITIVE
    if (this.currentY > 0) {
      return Math.abs(valueUp).toFixed(2);
    }
    if (this.currentY < 0) {
      return valueDown.toFixed(2);
    }
    return Math.abs(valueUp).toFixed(2);
  }
}

export default Knob;
