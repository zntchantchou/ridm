import { css, html, LitElement } from "lit";
import { customElement, state } from "lit/decorators.js";
import Application from "../../../main";
import Controls from "../../Controls";
import playIcon from "/pictures/play-round.svg";
import pauseIcon from "/pictures/pause-round.svg";

@customElement("play-pause-button")
export class PlayPauseButton extends LitElement {
  @state()
  private isPlaying: boolean = false;

  connectedCallback() {
    super.connectedCallback();
    this.isPlaying = Controls.isPlaying;
  }

  private async handleClick(e: Event) {
    e.preventDefault();
    await Application.handlePlayPause();
    this.isPlaying = Controls.isPlaying;
  }

  render() {
    return html`
      <div @click=${async (e: Event) => await this.handleClick(e)}>
        <img
          src=${this.isPlaying ? pauseIcon : playIcon}
          alt=${this.isPlaying ? "Pause" : "Play"}
        />
      </div>
    `;
  }

  static styles = css`
    div {
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    img {
      width: 100%;
      height: 100%;
    }
  `;
}
