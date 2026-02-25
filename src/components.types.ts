import type { Controls } from "./components/Controls/Controls";
import type { CounterElement } from "./components/Counter/Counter";
import type { FaderElement } from "./components/Fader/Fader";
import type { Footer } from "./components/Footer/Footer";
import type { KnobElement } from "./components/Knob/Knob";
import type { PanelSectionElement } from "./components/PanelSection/PanelSection";
import type { ResetButton } from "./components/ResetButton/ResetButton";
import type { SoundPanel } from "./components/SoundPanel/SoundPanel";
import type { TemplateButton } from "./components/TemplateButton/TemplateButton";
import type { StepperControlsElement } from "./components/StepperControls/StepperControls";
import type { ToggleElement } from "./components/Toggle/Toggle";
import type { Stepper } from "./components/Stepper/Stepper";
import type { RythmPanel } from "./components/RythmPanel/RythmPanel";
import type { TopNav } from "./components/TopNav/TopNav";

declare global {
  interface HTMLElementTagNameMap {
    "template-button": TemplateButton;
    "reset-button": ResetButton;
    "footer-element": Footer;
    "fader-element": FaderElement;
    "controls-element": Controls;
    "knob-element": KnobElement;
    "sound-panel": SoundPanel;
    "panel-section": PanelSectionElement;
    "counter-element": CounterElement;
    "toggle-element": ToggleElement;
    "rythm-panel": RythmPanel;
    "stepper-controls": StepperControlsElement;
    "stepper-element": Stepper;
    "top-nav": TopNav;
  }
}
