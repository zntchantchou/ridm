import { css, html, LitElement } from "lit";
import { customElement, state } from "lit/decorators.js";
import type { FeedbackDelayOptions, ReverbOptions } from "tone";
import type { StepperIdType } from "../../../../state/state.types";
import type { PitchOptions } from "../../../../types";
import State from "../../../../state/State";
import { INITIAL_CHANNEL_OPTIONS } from "../../../../state/state.constants";
import { styleMap } from "lit/directives/style-map.js";
import SampleRegistry from "../../../../modules/SampleRegistry";
import type { Subscription } from "rxjs";

@customElement("sound-panel")
export class SoundPanel extends LitElement {
  @state() private selectedStepperId: StepperIdType =
    State.getSelectedStepperId();

  @state() private fillColor =
    State.getSelectedStepperOptions()?.color.cssColor || "white";

  @state() private volume: number = State.getTrack(this.selectedStepperId)
    ?.channelOptions.volume as number;
  @state() private panning: number = State.getTrack(this.selectedStepperId)
    ?.channelOptions.pan as number;

  currentStepperIdSubscription: Subscription | null = null;

  @state()
  private sampleName = "";

  connectedCallback() {
    super.connectedCallback();
    const track = State.getTrack(this.selectedStepperId);
    if (track) {
      this.sampleName = SampleRegistry.resolve(track?.sampleId)?.file as string;
    }
    State.currentStepperIdSubject.subscribe((id) => {
      this.selectedStepperId = id;
      const currentColor = State.getSelectedStepperOptions()?.color.cssColor;
      if (currentColor) this.fillColor = currentColor;
      const track = State.getTrack(id);
      if (track) {
        this.volume = track?.channelOptions.volume as number;
        this.panning = track?.channelOptions.pan as number;
        this.sampleName = SampleRegistry.resolve(track?.sampleId)
          ?.file as string;
      }
      this.requestUpdate();
    });
  }
  disconnectedCallback(): void {
    if (this.currentStepperIdSubscription) {
      this.currentStepperIdSubscription.unsubscribe();
    }
  }

  private handleVolumeChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    State.channelUpdateSubject.next({
      stepperId: this.selectedStepperId as StepperIdType,
      channelOptions: { volume: parseFloat(target.value) },
    });
  };

  private handlePanningChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    State.channelUpdateSubject.next({
      stepperId: this.selectedStepperId as StepperIdType,
      channelOptions: { pan: parseFloat(target.value) },
    });
  };

  private handleDelayChange = (value: string, name: string) => {
    const rangeValue = parseFloat(value);
    const updateValue: { feedback?: number; wet?: number; delayTime?: number } =
      {};
    switch (name) {
      case "feedback":
        updateValue.feedback = rangeValue;
        break;
      case "wet":
        updateValue.wet = rangeValue;
        break;
      case "delayTime":
        updateValue.delayTime = rangeValue;
        break;
    }
    State.effectUpdateSubject.next({
      name: "delay",
      stepperId: this.selectedStepperId.toString(),
      value: updateValue,
    });
  };

  private handleReverbChange = (value: string, name: string) => {
    const rangeValue = parseFloat(value);
    const updateValue: { preDelay?: number; wet?: number; decay?: number } = {};
    switch (name) {
      case "decay":
        if (rangeValue > 0.001) updateValue.decay = rangeValue;
        else return;
        break;
      case "wet":
        updateValue.wet = rangeValue;
        break;
      case "preDelay":
        updateValue.preDelay = rangeValue;
        break;
    }
    State.effectUpdateSubject.next({
      name: "reverb",
      stepperId: this.selectedStepperId.toString(),
      value: updateValue,
    });
  };

  private handlePitchChange = (value: string) => {
    const rangeValue = parseFloat(value);
    const updateValue: PitchOptions = { pitch: rangeValue };
    State.effectUpdateSubject.next({
      name: "pitch",
      stepperId: this.selectedStepperId.toString(),
      value: updateValue,
    });
  };

  render() {
    const delayEffect = State.getEffect({
      trackId: this.selectedStepperId,
      name: "delay",
    })?.value as FeedbackDelayOptions;

    const reverbEffect = State.getEffect({
      trackId: this.selectedStepperId,
      name: "reverb",
    })?.value as ReverbOptions;

    const pitchEffect = State.getEffect({
      trackId: this.selectedStepperId,
      name: "pitch",
    })?.value as PitchOptions;

    return html`
      <div class="sound-panel" id="sound-panel">
        <div
          class="details-section"
          style=${styleMap({ borderColor: this.fillColor })}
        >
          <div class="sample-details">
            <div id="sample-details-header">
              <span
                style=${styleMap({ color: this.fillColor })}
                id="sample-name"
                >${this.sampleName}</span
              >
            </div>

            <fader-element
              fillColor=${this.fillColor}
              label="Volume"
              step="0.01"
              min=${-40}
              max=${40}
              direction="column"
              ?normalized=${true}
              value=${isNaN(this.volume)
                ? INITIAL_CHANNEL_OPTIONS.volume
                : this.volume}
              .onChange=${this.handleVolumeChange}
            ></fader-element>
            <fader-element
              fillColor=${this.fillColor}
              label="Panning"
              min=${-1}
              max=${1}
              variant="absolute"
              direction="column"
              ?normalized=${false}
              value=${isNaN(this.panning)
                ? INITIAL_CHANNEL_OPTIONS.pan
                : this.panning}
              .onChange=${this.handlePanningChange}
            ></fader-element>
          </div>
        </div>
        <div id="effects-section">
          <panel-section title="delay" color=${this.fillColor}>
            <knob-element
              label="WET"
              id="delay-wet"
              value="${delayEffect.wet}"
              min="0"
              max="1"
              fillColor="beige"
              .onChange="${this.handleDelayChange}"
              size="3"
              settingName="wet"
              effectName="delay"
            ></knob-element>
            <knob-element
              label="FEEDBACK"
              id="delay-feedback"
              value="${delayEffect.feedback}"
              min="0"
              max="1"
              fillColor="beige"
              .onChange="${this.handleDelayChange}"
              size="3"
              settingName="feedback"
              effectName="delay"
            ></knob-element>
            <knob-element
              label="TIME"
              id="delay-time"
              value="${delayEffect.delayTime.valueOf() as number}"
              min="0"
              max="1"
              fillColor="beige"
              .onChange="${this.handleDelayChange}"
              size="3"
              settingName="delayTime"
              effectName="delay"
            ></knob-element>
          </panel-section>
          <panel-section title="reverb" color=${this.fillColor}>
            <knob-element
              label="WET"
              id="reverb-wet"
              value="${reverbEffect.wet}"
              min="0"
              max="1"
              fillColor="beige"
              .onChange="${this.handleReverbChange}"
              size="3"
              settingName="wet"
              effectName="reverb"
            ></knob-element>
            <knob-element
              label="DECAY"
              id="reverb-decay"
              value="${reverbEffect.decay}"
              min="0.01"
              max="10"
              fillColor="beige"
              .onChange="${this.handleReverbChange}"
              size="3"
              settingName="decay"
              effectName="reverb"
            ></knob-element>
            <knob-element
              label="PREDELAY"
              id="reverb-predelay"
              value="${reverbEffect.preDelay}"
              min="0"
              max="6"
              fillColor="beige"
              .onChange="${this.handleReverbChange}"
              size="3"
              settingName="preDelay"
              effectName="reverb"
            ></knob-element>
          </panel-section>
          <panel-section title="pitch" color=${this.fillColor}>
            <knob-element
              label="PITCH"
              id="pitch-pitch"
              value="${pitchEffect.pitch}"
              min="-3"
              max="3"
              fillColor="beige"
              .onChange="${this.handlePitchChange}"
              size="3"
              settingName="pitch"
              effectName="pitch"
            ></knob-element>
          </panel-section>
        </div>
      </div>
    `;
  }

  static styles = css`
    :host {
      --container-border-radius: 10px;
      --section-background-color: rgb(33, 33, 33);
      --panel-section-padding: 0.6rem 1.8rem;
      --panel-section-border: rgb(209, 209, 209) solid 0.2rem;
      box-sizing: border-box;
      height: 100%;
      display: flex;
      flex-direction: row;
      width: 100%;
    }

    .sound-panel {
      box-sizing: border-box;
      border-radius: 6px 0 6px 6px;
      background-color: #1e1e1e;
      padding: 1rem 0rem;
      display: flex;
      width: 100%;
      color: white;
    }

    #sample-name {
      font-size: 1.4rem;
    }

    #sample-details-header {
      padding: 0 1rem;
      font-size: 1.8em;
    }

    #effects-section {
      display: flex;
      flex: 3;
    }

    .details-section {
      flex-direction: column;
      flex: 1;
      border-right: rgb(209, 209, 209) solid 0.15rem;
    }

    .sample-details {
      display: flex;
      flex-direction: column;
    }
  `;
}
