import { css, html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("mobile-disclaimer")
export class MobileDisclaimer extends LitElement {
  minSize = "1024";
  render() {
    return html`
      <div class="disclaimer-container">
        <div class="content">
          <div class="icon">
            <svg
              width="120"
              height="120"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="4"
                y="2"
                width="16"
                height="20"
                rx="2"
                stroke="currentColor"
                stroke-width="1.5"
                fill="none"
              />
              <path
                d="M4 18h16"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
              <circle cx="12" cy="20" r="0.5" fill="currentColor" />
              <path
                d="M8 10l4 4 4-4"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
          <h1>Desktop Experience Required</h1>
          <p class="main-message">
            This audio sequencer is optimized for larger screens and requires a
            desktop or tablet device.
          </p>
          <p class="sub-message">
            Please visit this site on a device with a screen width of at least
            ${this.minSize}px to enjoy the full experience.
          </p>
        </div>
      </div>
    `;
  }

  static styles = css`
    :host {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100vh;
      background: radial-gradient(
        circle at center,
        rgb(66, 68, 75) 40%,
        rgb(48, 50, 55) 60%,
        rgb(20, 20, 21) 100%
      );
      z-index: 9999;
    }

    @media (max-width: 1024px) {
      :host {
        display: flex;
        justify-content: center;
        align-items: center;
      }
    }

    .disclaimer-container {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;
      padding: 2rem;
      box-sizing: border-box;
    }

    .content {
      text-align: center;
      max-width: 500px;
      color: white;
      animation: fadeIn 0.6s ease-in-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .icon {
      color: rgb(126, 126, 126);
      margin-bottom: 2rem;
      animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
      0%,
      100% {
        opacity: 0.6;
        transform: scale(1);
      }
      50% {
        opacity: 1;
        transform: scale(1.05);
      }
    }

    h1 {
      font-family: "conthrax", Verdana, sans-serif;
      font-size: 1.8rem;
      margin: 0 0 1.5rem 0;
      color: rgb(220, 220, 220);
      letter-spacing: 0.5px;
    }
    * {
      font-family: "basico", Verdana, sans-serif;
    }
    .main-message {
      font-size: 1.1rem;
      line-height: 1.6;
      margin: 0 0 1rem 0;
      color: rgb(200, 200, 200);
    }

    .sub-message {
      font-size: 0.95rem;
      line-height: 1.5;
      margin: 0;
      color: rgb(150, 150, 150);
    }
  `;
}
