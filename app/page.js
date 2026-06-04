"use client";

import { useCallback, useEffect, useState } from "react";

// Backend base URL. Override at build/run time with NEXT_PUBLIC_BIFROST_URL,
// e.g. http://206.189.100.31:8088 when pointing at the droplet.
const API = (process.env.NEXT_PUBLIC_BIFROST_URL || "http://localhost:8088").replace(/\/$/, "");

function BridgeArc() {
  // Stylized Bifröst — a rainbow bridge arc.
  return (
    <svg className="bridge" viewBox="0 0 600 96" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <defs>
        <linearGradient id="spectrum" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ff4d6d" />
          <stop offset="17%" stopColor="#ff9e44" />
          <stop offset="34%" stopColor="#ffe14d" />
          <stop offset="50%" stopColor="#4dd88a" />
          <stop offset="67%" stopColor="#46c9ff" />
          <stop offset="84%" stopColor="#7c6bff" />
          <stop offset="100%" stopColor="#c84dff" />
        </linearGradient>
      </defs>
      <path className="arc glow" d="M20 88 Q300 -36 580 88" />
      <path className="arc" stroke="url(#spectrum)" d="M20 88 Q300 -36 580 88" />
    </svg>
  );
}

export default function Home() {
  const [connected, setConnected] = useState(null); // null=unknown, true/false
  const [settings, setSettings] = useState({ enabled: true, passthrough_harmful: true });
  const [model, setModel] = useState("");
  const [savingKey, setSavingKey] = useState(null); // which toggle is mid-flight
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [meta, setMeta] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  // Pull current backend settings (and prove connectivity) on load.
  const loadSettings = useCallback(async () => {
    try {
      const r = await fetch(`${API}/settings`, { cache: "no-store" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d = await r.json();
      setSettings({ enabled: !!d.enabled, passthrough_harmful: !!d.passthrough_harmful });
      setModel(d.model || "");
      setConnected(true);
      setError("");
    } catch (e) {
      setConnected(false);
      setError(`Cannot reach backend at ${API} — ${e.message}`);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Flip a runtime toggle on the backend; optimistic, reverts on failure.
  async function toggle(key) {
    const prev = settings;
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    setSavingKey(key);
    setError("");
    try {
      const r = await fetch(`${API}/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: next[key] }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d = await r.json();
      setSettings({ enabled: !!d.enabled, passthrough_harmful: !!d.passthrough_harmful });
    } catch (e) {
      setSettings(prev); // revert
      setError(`Failed to update ${key}: ${e.message}`);
    } finally {
      setSavingKey(null);
    }
  }

  async function send() {
    const text = prompt.trim();
    if (!text || sending) return;
    setSending(true);
    setError("");
    setResponse("");
    setMeta(null);
    try {
      const r = await fetch(`${API}/v1/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: text }] }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error?.message || `HTTP ${r.status}`);
      setResponse(d?.choices?.[0]?.message?.content ?? "(no content)");
      setMeta(d?.x_bifrost ?? null);
    } catch (e) {
      setError(`Request failed: ${e.message}`);
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") send();
  }

  const StateTag = ({ on }) => (
    <span className={`state ${on ? "on" : "off"}`}>{on ? "ON" : "OFF"}</span>
  );

  return (
    <div className="wrap">
      <header className="hero">
        <BridgeArc />
        <h1 className="title">Bifrost</h1>
        <p className="subtitle">The never-refuse bridge — runtime console. Toggles apply instantly, no restart.</p>
      </header>

      <div className="statusline">
        <span className="badge">
          <span className={`dot ${connected ? "ok" : connected === false ? "bad" : ""}`} />
          {connected === null ? "connecting…" : connected ? "backend connected" : "backend offline"}
        </span>
        {model && <span className="badge mono">model · {model}</span>}
        <span className="badge mono">{API}</span>
      </div>

      <section className="panel">
        <div className="panel-title">Runtime controls</div>

        <div className="row">
          <div>
            <div className="toggle-label">
              Bifrost pipeline <StateTag on={settings.enabled} />
            </div>
            <div className="toggle-desc">
              Master switch. ON routes prompts through the never-refuse pipeline. OFF sends them
              straight to the model — no system injection, refusal detection, or regeneration.
            </div>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={settings.enabled}
              disabled={!connected || savingKey === "enabled"}
              onChange={() => toggle("enabled")}
            />
            <span className="slider" />
          </label>
        </div>

        <div className="row">
          <div>
            <div className="toggle-label">
              Passthrough harmful <StateTag on={settings.passthrough_harmful} />
            </div>
            <div className="toggle-desc">
              Safety brake. ON leaves refusals on genuinely harmful requests untouched. OFF lets
              Bifrost also try to override those refusals. No effect while the pipeline is OFF.
            </div>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={settings.passthrough_harmful}
              disabled={!connected || !settings.enabled || savingKey === "passthrough_harmful"}
              onChange={() => toggle("passthrough_harmful")}
            />
            <span className="slider" />
          </label>
        </div>
      </section>

      <section className="panel">
        <div className="panel-title">Composer</div>
        <textarea
          placeholder="Type a prompt…  (⌘/Ctrl + Enter to send)"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <div className="send-row">
          <button className="btn" onClick={send} disabled={sending || !connected || !prompt.trim()}>
            {sending ? "Sending…" : "Send"}
          </button>
          <span className="hint">
            routing through <span className="route-pill">{settings.enabled ? "Bifrost" : "the model directly"}</span>
          </span>
        </div>
        {error && <div className="err">{error}</div>}
      </section>

      <section className="panel">
        <div className="panel-title">Response</div>
        <div className="response-wrap">
          <div className="response">
            {sending ? (
              <span className="typing" />
            ) : response ? (
              response
            ) : (
              <span className="hint">Model response will appear here.</span>
            )}
          </div>
        </div>
        {meta && (
          <div className="meta">
            {Object.entries(meta).map(([k, v]) => (
              <span className="chip" key={k}>
                {k}: <b>{String(v)}</b>
              </span>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
