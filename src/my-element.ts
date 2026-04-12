import { LitElement, css, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import './cube-game.ts'

type Theme = 'light' | 'dark' | 'system';

/**
 * Main application element with a viewport-optimized layout.
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
        <nav class="top-nav">
          <div class="logo">CUDE<span>2x2</span></div>
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
        </nav>

        <main id="center">
          <div class="game-card">
            <cube-game></cube-game>
          </div>
        </main>
        
        <footer class="footer">
          <p>Keyboard: <b>Q/A, W/S, E/D, R/F</b> • Scramble: <b>Space</b></p>
        </footer>
      </div>
    `
  }

  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100vh;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      --transition-speed: 0.4s;
      overflow: hidden;
    }

    #app-root {
      --text: #4b5563;
      --text-h: #111827;
      --bg: #f9fafb;
      --card-bg: #ffffff;
      --border: #e5e7eb;
      --accent: #7c3aed;
      --accent-hover: #6d28d9;
      --accent-bg: rgba(124, 58, 237, 0.08);
      --nav-bg: rgba(255, 255, 255, 0.8);
      --shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
      --game-bg: radial-gradient(circle at center, #ffffff 0%, #f3f4f6 100%);

      width: 100%;
      height: 100vh;
      display: flex;
      flex-direction: column;
      background-color: var(--bg);
      color: var(--text);
      transition: background-color var(--transition-speed), color var(--transition-speed);
      box-sizing: border-box;
    }

    @media (prefers-color-scheme: dark) {
      #app-root.system {
        --text: #9ca3af;
        --text-h: #f3f4f6;
        --bg: #0f172a;
        --card-bg: #1e293b;
        --border: #334155;
        --accent: #a78bfa;
        --accent-hover: #c4b5fd;
        --accent-bg: rgba(167, 139, 250, 0.12);
        --nav-bg: rgba(15, 23, 42, 0.8);
        --shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
        --game-bg: radial-gradient(circle at center, #1e293b 0%, #0f172a 100%);
      }
    }

    #app-root.dark {
      --text: #9ca3af;
      --text-h: #f3f4f6;
      --bg: #0f172a;
      --card-bg: #1e293b;
      --border: #334155;
      --accent: #a78bfa;
      --accent-hover: #c4b5fd;
      --accent-bg: rgba(167, 139, 250, 0.12);
      --nav-bg: rgba(15, 23, 42, 0.8);
      --shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
      --game-bg: radial-gradient(circle at center, #1e293b 0%, #0f172a 100%);
    }

    .top-nav {
      height: 70px;
      flex-shrink: 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 2rem;
      background: var(--nav-bg);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border);
      z-index: 1000;
    }

    .logo {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--text-h);
      letter-spacing: -0.025em;
    }

    .logo span {
      color: var(--accent);
      margin-left: 2px;
    }

    .theme-switcher {
      display: flex;
      gap: 4px;
      background: var(--border);
      padding: 3px;
      border-radius: 10px;
    }

    .theme-switcher button {
      background: transparent;
      border: none;
      padding: 6px;
      cursor: pointer;
      color: var(--text);
      border-radius: 7px;
      display: flex;
    }

    .theme-switcher button.active {
      background: var(--card-bg);
      color: var(--accent);
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .theme-switcher svg { width: 18px; height: 18px; }

    main {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem 2rem;
      min-height: 0; /* Important for flex child to be able to shrink */
    }

    .game-card {
      width: 100%;
      height: 100%;
      max-width: 1000px;
      background: var(--card-bg);
      border-radius: 24px;
      box-shadow: var(--shadow);
      border: 1px solid var(--border);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .footer {
      height: 40px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      color: var(--text);
      opacity: 0.8;
      border-top: 1px solid var(--border);
      background: var(--card-bg);
    }

    footer b { color: var(--accent); }

    @media (max-width: 768px) {
      .top-nav { padding: 0 1rem; }
      main { padding: 0.5rem; }
      .game-card { border-radius: 0; border: none; }
      .footer { display: none; }
    }
  `
}

declare global {
  interface HTMLElementTagNameMap {
    'my-element': MyElement
  }
}
