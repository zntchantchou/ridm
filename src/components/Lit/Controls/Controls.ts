import { css, html, LitElement } from "lit";
import { customElement, state } from "lit/decorators.js";
import State from "../../../state/State";
import Audio from "../../../modules/Audio";
import {
  INITIAL_SETTINGS,
  MAX_VOLUME_DB,
  MIN_VOLUME_DB,
} from "../../../state/state.constants";

@customElement("controls-element")
export class Controls extends LitElement {
  @state()
  tpc = 3;
  @state()
  volume = 10;

  private handleTpcChange = (e: Event) => {
    State.steppersLoadingSubject.next(true);
    Audio.lastVolume = Audio.getCurrentVolume() as number;
    const updatedValue = (e?.target as HTMLInputElement).value;
    this.tpc = parseFloat(updatedValue);
    State.tpcUpdateSubject.next(parseFloat(updatedValue));
    State.steppersLoadingSubject.next(false);
  };

  private handleVolumeChange = (e: Event) => {
    const updatedValue = (e?.target as HTMLInputElement).value;
    this.volume = parseFloat(updatedValue);
    Audio.setMasterVolume(this.volume);
    State.volumeUpdateSubject.next(this.volume);
  };

  render() {
    return html` <div id="controls">
      <div class="control-group">
        <div id="app-title">
          <span>Ridm</span>
        </div>
      </div>
      <div class="control-group">
        <play-pause-button id="play"></play-pause-button>
        <reset-button></reset-button>
      </div>
      <div id="tpc-group">
        <fader-element
          label="Time per cycle (seconds)"
          step="0.01"
          min="1"
          max="4"
          value=${State.getSettings().tpc || INITIAL_SETTINGS.tpc}
          .onChange=${(e: Event) => this.handleTpcChange(e)}
        ></fader-element>
      </div>
      <div id="volume-group">
        <fader-element
          label="Volume"
          min=${MIN_VOLUME_DB}
          max=${MAX_VOLUME_DB}
          ?normalized=${true}
          value=${State.getSettings().volume || INITIAL_SETTINGS.volume}
          .onChange=${(e: Event) => this.handleVolumeChange(e)}
        ></fader-element>
      </div>
    </div>`;
  }

  static styles = css`
    #app-title span {
      font-family: "conthrax";
      font-size: 2.2rem;
    }

    #volume-group,
    #tpc-group {
      flex: 5;
    }

    #volume-group input,
    #tpc-group input {
      flex: 2;
    }

    .control-group {
      display: flex;
      height: 5rem;
      align-items: center;
      margin-right: 1rem;
    }

    .control-group input {
      margin: 0 2rem;
    }

    #controls {
      font-size: 0.9rem;
      color: white;
      box-sizing: border-box;
      display: flex;
      justify-content: space-around;
      align-items: center;
      padding-bottom: 0.4rem;
      border-bottom: rgb(230, 230, 230) 4px solid;
      width: 100%;
      height: var(--controls-height);
      padding: 0rem 1rem;
    }
  `;
}
