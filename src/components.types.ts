import type { LitComponent } from "./components/Lit";
import type { Controls } from "./components/Lit/Controls/Controls";
import type { FaderElement } from "./components/Lit/Fader/Fader";
import type { Footer } from "./components/Lit/Footer/Footer";
import type { KnobElement } from "./components/Lit/Knob/Knob";
import type { PanelSectionElement } from "./components/Lit/PanelSection/PanelSection";
import type { ResetButton } from "./components/Lit/ResetButton/ResetButton";
import type { SoundPanel } from "./components/Lit/SoundPanel/SoundPanel";
import type { TemplateButton } from "./components/Lit/TemplateButton/TemplateButton";

declare global {
  interface HTMLElementTagNameMap {
    "lit-panel": LitComponent;
    "template-button": TemplateButton;
    "reset-button": ResetButton;
    "footer-element": Footer;
    "fader-element": FaderElement;
    "controls-element": Controls;
    "knob-element": KnobElement;
    "sound-panel": SoundPanel;
    "panel-section": PanelSectionElement;
  }
}
