import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import Application from "../../../main";
import type { TemplateName } from "../../../state/state.types";

@customElement("template-button")
export class TemplateButton extends LitElement {
  @property()
  text: string = "default text";
  @property()
  templateName: TemplateName = "initial";

  render() {
    return html`<button
      @click=${() => Application.loadTemplate(this.templateName)}
    >
      ${this.text}
    </button>`;
  }

  static styles = css`
    :host {
      display: inline-block;
    }

    button {
      color: black;
      margin-left: 1rem;
      background: #d5d4d3;
      font-family: inherit;
      padding: 0.4em 1em;
      font-weight: 800;
      font-size: 0.9rem;
      border: 3px solid black;
      border-radius: 0.4em;
      box-shadow: 0.1em 0.1em;
      cursor: pointer;
    }

    button:hover {
      transform: translate(-0.05em, -0.05em);
      box-shadow: 0.15em 0.15em;
    }

    button:active {
      transform: translate(0.05em, 0.05em);
      box-shadow: 0.05em 0.05em;
    }
  `;
}
