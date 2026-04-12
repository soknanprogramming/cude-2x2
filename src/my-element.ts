import { LitElement, css, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import './cube-game.ts'

type Theme = 'light' | 'dark' | 'system';

/**
 * Main application element.
 */
@customElement('my-element')
export class MyElement extends LitElement {
  @state()
  private theme: Theme = 'system';

  connectedCallback() {
    super.connectedCallback();
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      this.theme = savedTheme;
    }
  }

  private setTheme(theme: Theme) {
    this.theme = theme;
    localStorage.setItem('theme', theme);
  }

  render() {
    return html`
      <div id="app-root" class="${this.theme}">
        <div class="theme-switcher">
          <button class="${this.theme === 'light' ? 'active' : ''}" @click=${() => this.setTheme('light')} title="Light Mode">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
          </button>
          <button class="${this.theme === 'dark' ? 'active' : ''}" @click=${() => this.setTheme('dark')} title="Dark Mode">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          </button>
          <button class="${this.theme === 'system' ? 'active' : ''}" @click=${() => this.setTheme('system')} title="System Theme">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
          </button>
        </div>
        <section id="center">
          <cube-game></cube-game>
        </section>
      </div>
    `
  }

  static styles = css`
    :host {
      display: block;
      width: 100%;
      min-height: 100vh;
      font-family: system-ui, -apple-system, sans-serif;
    }

    #app-root {
      --text: #6b6375;
      --text-h: #08060d;
      --bg: #ffffff;
      --border: #e5e4e7;
      --accent: #aa3bff;
      --accent-bg: rgba(170, 59, 255, 0.1);
      --accent-border: rgba(170, 59, 255, 0.5);
      --social-bg: rgba(244, 243, 236, 0.5);
      --shadow: rgba(0, 0, 0, 0.1) 0 10px 15px -3px, rgba(0, 0, 0, 0.05) 0 4px 6px -2px;
      --game-bg: radial-gradient(circle at center, #f8f9fa 0%, #e9ecef 100%);
      --code-bg: #f4f3ec;

      width: 100%;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background-color: var(--bg);
      color: var(--text);
      transition: background-color 0.3s, color 0.3s;
      box-sizing: border-box;
    }

    /* System Dark Theme */
    @media (prefers-color-scheme: dark) {
      #app-root.system {
        --text: #9ca3af;
        --text-h: #f3f4f6;
        --bg: #16171d;
        --border: #2e303a;
        --accent: #c084fc;
        --accent-bg: rgba(192, 132, 252, 0.15);
        --accent-border: rgba(192, 132, 252, 0.5);
        --social-bg: rgba(47, 48, 58, 0.5);
        --shadow: rgba(0, 0, 0, 0.4) 0 10px 15px -3px, rgba(0, 0, 0, 0.25) 0 4px 6px -2px;
        --game-bg: radial-gradient(circle at center, #1a1a2e 0%, #0a0a0a 100%);
        --code-bg: #1f2028;
      }
    }

    /* Explicit Dark Theme */
    #app-root.dark {
      --text: #9ca3af;
      --text-h: #f3f4f6;
      --bg: #16171d;
      --border: #2e303a;
      --accent: #c084fc;
      --accent-bg: rgba(192, 132, 252, 0.15);
      --accent-border: rgba(192, 132, 252, 0.5);
      --social-bg: rgba(47, 48, 58, 0.5);
      --shadow: rgba(0, 0, 0, 0.4) 0 10px 15px -3px, rgba(0, 0, 0, 0.25) 0 4px 6px -2px;
      --game-bg: radial-gradient(circle at center, #1a1a2e 0%, #0a0a0a 100%);
      --code-bg: #1f2028;
    }

    .theme-switcher {
      position: fixed;
      top: 20px;
      right: 20px;
      display: flex;
      gap: 4px;
      background: var(--social-bg);
      padding: 4px;
      border-radius: 12px;
      border: 1px solid var(--border);
      backdrop-filter: blur(8px);
      z-index: 1000;
    }

    .theme-switcher button {
      background: transparent;
      border: none;
      padding: 8px;
      cursor: pointer;
      color: var(--text);
      border-radius: 8px;
      display: flex;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .theme-switcher button:hover {
      background: var(--accent-bg);
      color: var(--accent);
    }

    .theme-switcher button.active {
      background: var(--bg);
      color: var(--accent);
      box-shadow: var(--shadow);
    }

    .theme-switcher svg {
      width: 18px;
      height: 18px;
    }

    #center {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex-grow: 1;
      padding: 20px;
    }

    h1, h2 {
      font-weight: 500;
      color: var(--text-h);
    }

    code {
      font-family: monospace;
      font-size: 15px;
      padding: 4px 8px;
      border-radius: 4px;
      color: var(--text-h);
      background: var(--code-bg);
    }

    @media (max-width: 1024px) {
      #center { padding: 32px 20px 24px; }
    }
  `
}

declare global {
  interface HTMLElementTagNameMap {
    'my-element': MyElement
  }
}
