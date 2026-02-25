import { css, html, LitElement } from "lit";
import { customElement, state } from "lit/decorators.js";
import Application from "../../main";
import playIcon from "/pictures/play-round.svg";
import pauseIcon from "/pictures/pause-round.svg";
import State from "../../state/State";
import type { Subscription } from "rxjs";

@customElement("play-pause-button")
export class PlayPauseButton extends LitElement {
  @state()
  private isPlaying: boolean = false;
  private isPlayingSubscription?: Subscription;

  connectedCallback() {
    super.connectedCallback();
    this.isPlayingSubscription = State.isPlayingSubject.subscribe((v) => {
      this.isPlaying = v;
    });
  }

  disconnectedCallback(): void {
    if (this.isPlayingSubscription) this.isPlayingSubscription.unsubscribe();
  }

  private async handleClick(e: Event) {
    e.preventDefault();
    await Application.handlePlayPause();
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
      height: 3.8rem;
      width: 3.8rem;
      margin: 0 1rem;

      box-sizing: border-box;
    }

    img {
      width: 100%;
      height: 100%;
    }
  `;
}
