import * as Tone from "tone";
import type Stepper from "./components/Stepper";
import type { LitComponent } from "./components/Lit";
import type { TemplateButton } from "./components/Lit/TemplateButton/TemplateButton";
import type { ResetButton } from "./components/Lit/ResetButton/ResetButton";
import type { Footer } from "./components/Lit/Footer/Footer";

export type BeatMapType = Map<string, { steppers: Stepper[] }>;

export type SoundSettings = {
  name: string;
  node: AudioNode;
  options?: { [index: string]: string };
};

export type ToneSoundSettings = {
  name: string;
  node: Tone.ToneAudioNode;
  options?: { [index: string]: string };
};

export type TrackEffect = {
  name: string;
  node: Tone.ToneAudioNode;
  options?: { [index: string]: string };
};

export type EffectNameType = "pitch" | "delay" | "reverb";

export type PitchOptions = { pitch: number };

export type EffectValue = Partial<
  | Tone.FeedbackDelayOptions
  | PitchOptions // custom pitch
  | Tone.ReverbOptions
>;

export interface IEffectValue
  extends
    Tone.ChannelOptions,
    Tone.FeedbackDelayOptions,
    Tone.ReverbOptions,
    PitchOptions {}

export type EffectUpdate = {
  name: EffectNameType;
  stepperId: string;
  value: EffectValue;
};

declare global {
  interface HTMLElementTagNameMap {
    "lit-panel": LitComponent;
    "template-button": TemplateButton;
    "reset-button": ResetButton;
    "footer-element": Footer;
  }
}
