import type { LitComponent } from "./components/Lit";
import type { Controls } from "./components/Lit/Controls/Controls";
import type { FaderElement } from "./components/Lit/Fader/Fader";
import type { Footer } from "./components/Lit/Footer/Footer";
import type { ResetButton } from "./components/Lit/ResetButton/ResetButton";
import type { TemplateButton } from "./components/Lit/TemplateButton/TemplateButton";

declare global {
  interface HTMLElementTagNameMap {
    "lit-panel": LitComponent;
    "template-button": TemplateButton;
    "reset-button": ResetButton;
    "footer-element": Footer;
    "fader-element": FaderElement;
    "controls-element": Controls;
  }
}
