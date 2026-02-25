import { css, html, LitElement } from "lit";
import { customElement, state } from "lit/decorators.js";
import State from "../../state/State";
import { take } from "rxjs";

@customElement("footer-element")
export class Footer extends LitElement {
  @state()
  visible: boolean = false;

  constructor() {
    super();
    State.currentStepperIdSubject.pipe(take(1)).subscribe(() => {
      this.visible = true;
    });
  }

  render() {
    if (!this.visible) return null;
    return html`
      <div id="footer">
        <div id="footer-content">
          <span> Made by&nbsp;</span>
          <a href="https://github.com/zntchantchou/ridm">
            <span> zntchantchou </span>
            <img
              height="24"
              width="24"
              src="./pictures/gh.svg"
              srcset=""
              alt="github"
            />
          </a>
          <span id="separator"> | </span>
          <template-button
            templateName="mamakossa"
            text="#Mamakossa"
          ></template-button>
          <template-button
            templateName="nottoochaabi"
            text="#NotTooChaabi"
          ></template-button>
          <span id="separator"> | </span>
          <span id="separator"> Press space to play/pause </span>
        </div>
      </div>
    `;
  }

  static styles = css`
    :host {
      margin-top: 0.5rem;
      color: rgb(126, 126, 126);
      font-weight: 100;
      display: flex;
      align-items: center;
      visibility: visible;
    }
    :host #separator {
      margin-left: 1rem;
    }

    #footer-content {
      display: flex;
      align-items: flex-end;
      height: fit-content;
    }

    :host img {
      max-width: 100%;
      max-height: 100%;
    }

    :host a {
      all: unset;
      cursor: pointer;
    }
  `;
}
