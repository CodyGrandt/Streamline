import { useState } from "react";
import type { AppState } from "../state/appState";
import type { Action } from "../state/reducer";

export function SettingsScreen({ state, dispatch }: { state: AppState; dispatch: (action: Action) => void }) {
  const [leadIn, setLeadIn] = useState(String(state.data.settings.defaultLeadInS));
  return <section className="screen narrow-screen settings-screen">
    <div className="section-heading"><div><div className="eyebrow">APP SETTINGS</div><h2>Settings</h2><p>Customize the timing cues used while logging.</p></div></div>
    <div className="settings-card"><label><strong>Hold lead-in</strong><span>Seconds to get into position before every timed hold or stretch begins.</span><input type="number" min="0" step="1" value={leadIn} onChange={(event) => setLeadIn(event.target.value)} /></label><button className="button primary" disabled={!leadIn || Number(leadIn) < 0} onClick={() => dispatch({ type: "UPDATE_SETTINGS", defaultLeadInS: Number(leadIn) })}>Save timing settings</button></div>
    <div className="info-panel"><strong>Current default</strong><p>Every hold uses {state.data.settings.defaultLeadInS} seconds of lead-in. Exercise-specific overrides can be added later.</p></div>
  </section>;
}
