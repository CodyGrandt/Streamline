import { useState } from "react";
import { newId } from "../domain/ids";
import { getPlanDays } from "../domain/plan";
import type { AppState } from "../state/appState";
import type { Action } from "../state/reducer";

type Props = { state: AppState; dispatch: (action: Action) => void };

export function PlansScreen({ state, dispatch }: Props) {
  const [newName, setNewName] = useState("");
  const plans = Object.values(state.data.plans);
  return (
    <section className="screen narrow-screen">
      <div className="section-heading"><div><div className="eyebrow">YOUR TRAINING</div><h2>Plans</h2><p>Create the structure you want to follow. The example is only a starting point.</p></div></div>
      <div className="create-row">
        <input value={newName} onChange={(event) => setNewName(event.target.value)} placeholder="New plan name" onKeyDown={(event) => { if (event.key === "Enter" && newName.trim()) { dispatch({ type: "CREATE_PLAN", planId: newId("plan"), name: newName.trim(), now: Date.now() }); setNewName(""); } }} />
        <button className="button primary" disabled={!newName.trim()} onClick={() => { dispatch({ type: "CREATE_PLAN", planId: newId("plan"), name: newName.trim(), now: Date.now() }); setNewName(""); }}>Create plan</button>
      </div>
      <div className="plan-list">
        {plans.map((plan) => {
          const days = getPlanDays(state.data, plan.id);
          return <article className={plan.isActive ? "plan-card active-plan" : "plan-card"} key={plan.id}>
            <div className="plan-card-top"><div><div className="plan-status">{plan.isActive ? "ACTIVE PLAN" : "AVAILABLE PLAN"}</div><h3>{plan.name}</h3><p>{plan.description || "No description yet."}</p></div><button className="button secondary" title={`Edit ${plan.name}, including its days and blocks`} onClick={() => { dispatch({ type: "SELECT_PLAN", planId: plan.id }); dispatch({ type: "NAVIGATE", route: "plan-editor" }); }}>Edit</button></div>
            <div className="plan-days">{days.length ? days.map((day) => <span key={day.id}>{day.name}{day.weekday ? ` · ${["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][day.weekday]}` : ""}</span>) : <span>No training days yet</span>}</div>
            {!plan.isActive && <button className="text-button" title={`Use ${plan.name} when opening Today`} onClick={() => dispatch({ type: "ACTIVATE_PLAN", planId: plan.id })}>Make active</button>}
          </article>;
        })}
      </div>
      <div className="info-panel"><strong>Why plans come first</strong><p>Every exercise and block below is user-editable. When a session starts, the plan is snapshotted so later plan changes never rewrite history.</p></div>
    </section>
  );
}
