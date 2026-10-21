import type {
  DataDocument,
  Exercise,
  ID,
  Plan,
  PlanBlock,
  PlanDay,
  PlanExercise,
  Session,
  SetEntry,
} from "./model";

const now = Date.UTC(2026, 9, 21, 12);

const exercises: Exercise[] = [
  { id: "exercise_bulgarian_split_squat", name: "Bulgarian split squat", category: "strength", metric: "reps", source: "system", pattern: "legs", sideMode: "eachSide" },
  { id: "exercise_hanging_knee_raise", name: "Hanging knee raise", category: "strength", metric: "reps", source: "system", pattern: "core", sideMode: "none" },
  { id: "exercise_glute_bridge", name: "Glute bridge", category: "strength", metric: "reps", source: "system", pattern: "legs", sideMode: "none" },
  { id: "exercise_hollow_body_hold", name: "Hollow-body hold", category: "skill", metric: "seconds", source: "system", pattern: "core", sideMode: "none" },
  { id: "exercise_lunge", name: "Lunge", category: "strength", metric: "reps", source: "system", pattern: "legs", sideMode: "eachSide" },
  { id: "exercise_side_plank", name: "Side plank", category: "skill", metric: "seconds", source: "system", pattern: "core", sideMode: "eachSide" },
  ...Array.from({ length: 6 }, (_, index) => ({
    id: `exercise_active_stretch_${index + 1}`,
    name: `Active stretch ${index + 1}`,
    category: "stretch" as const,
    metric: "seconds" as const,
    source: "system" as const,
    pattern: "mobility" as const,
    defaultHoldS: 60,
    sideMode: "none" as const,
  })),
  { id: "exercise_pull_up", name: "Pull-up", category: "strength", metric: "reps", source: "system", pattern: "pull", sideMode: "none" },
  { id: "exercise_push_up", name: "Push-up", category: "strength", metric: "reps", source: "system", pattern: "push", sideMode: "none" },
  { id: "exercise_wall_handstand", name: "Wall handstand", category: "skill", metric: "seconds", source: "system", skillId: "handstand", pattern: "push", leadInS: 3, sideMode: "none" },
];

const demoPlan: Plan = {
  id: "plan_demo_lower_body_core",
  name: "Lower body + core example",
  description: "A flexible example plan. Edit it or create a plan of your own.",
  isActive: true,
  createdAt: now,
  updatedAt: now,
};

const demoDay: PlanDay = {
  id: "day_demo_lower_body",
  planId: demoPlan.id,
  weekday: 5,
  name: "Lower body + core",
  order: 0,
};

const blocks: PlanBlock[] = [
  { id: "block_demo_mobility", dayId: demoDay.id, name: "Active mobility", type: "timedSequence", order: 0, roundsMin: 1, roundsMax: 1, restMinS: 0, restMaxS: 5, transitionS: 5 },
  { id: "block_demo_split_squat", dayId: demoDay.id, name: "Split squat + knee raise", type: "superset", order: 1, roundsMin: 4, roundsMax: 4, restMinS: 45, restMaxS: 60 },
  { id: "block_demo_bridge", dayId: demoDay.id, name: "Glute bridge + hollow hold", type: "superset", order: 2, roundsMin: 3, roundsMax: 3, restMinS: 45, restMaxS: 60 },
  { id: "block_demo_lunge", dayId: demoDay.id, name: "Lunge + side plank", type: "superset", order: 3, roundsMin: 3, roundsMax: 3, restMinS: 45, restMaxS: 60 },
];

const planExercises: PlanExercise[] = [
  ...Array.from({ length: 6 }, (_, index) => ({
    id: `plan_exercise_demo_stretch_${index + 1}`,
    blockId: blocks[0].id,
    exerciseId: `exercise_active_stretch_${index + 1}`,
    order: index,
    secondsMin: 60,
    secondsMax: 60,
    sideMode: "none" as const,
  })),
  { id: "plan_exercise_demo_split_squat", blockId: blocks[1].id, exerciseId: "exercise_bulgarian_split_squat", order: 0, repsMin: 8, repsMax: 12, sideMode: "eachSide" },
  { id: "plan_exercise_demo_knee_raise", blockId: blocks[1].id, exerciseId: "exercise_hanging_knee_raise", order: 1, repsMin: 8, repsMax: 12, sideMode: "none" },
  { id: "plan_exercise_demo_bridge", blockId: blocks[2].id, exerciseId: "exercise_glute_bridge", order: 0, repsMin: 10, repsMax: 15, sideMode: "none" },
  { id: "plan_exercise_demo_hollow", blockId: blocks[2].id, exerciseId: "exercise_hollow_body_hold", order: 1, secondsMin: 30, secondsMax: 60, sideMode: "none" },
  { id: "plan_exercise_demo_lunge", blockId: blocks[3].id, exerciseId: "exercise_lunge", order: 0, repsMin: 10, repsMax: 10, sideMode: "eachSide" },
  { id: "plan_exercise_demo_side_plank", blockId: blocks[3].id, exerciseId: "exercise_side_plank", order: 1, secondsMin: 20, secondsMax: 30, sideMode: "eachSide" },
];

function asRecord<T extends { id: ID }>(items: T[]): Record<ID, T> {
  return Object.fromEntries(items.map((item) => [item.id, item]));
}

export function createSeedData(): DataDocument {
  return {
    version: 1,
    exercises: asRecord(exercises),
    levels: {},
    plans: asRecord([demoPlan]),
    planDays: asRecord([demoDay]),
    planBlocks: asRecord(blocks),
    planExercises: asRecord(planExercises),
    sessionPlanItems: {},
    sessions: {},
    setEntries: {},
    skippedBlocks: {},
    weeklyReviews: {},
    settings: {
      defaultLeadInS: 3,
      transitionS: 5,
      levelUpCleanHoldS: 15,
      levelUpRequiredHolds: 3,
    },
  };
}

export function cloneData(data: DataDocument): DataDocument {
  return structuredClone(data);
}

export function makeDemoHistory(data: DataDocument): DataDocument {
  const history = cloneData(data);
  const demoSession: Session = {
    id: "session_demo_previous",
    date: "2026-10-16",
    weekday: 5,
    planId: demoPlan.id,
    planDayId: demoDay.id,
    startedAt: now - 60 * 60 * 1000,
    finishedAt: now - 30 * 60 * 1000,
    finishMode: "manual",
    note: "Example history so previous results have something to show.",
  };
  history.sessions[demoSession.id] = demoSession;
  for (const item of planExercises.filter((item) => item.blockId !== blocks[0].id)) {
    const exercise = history.exercises[item.exerciseId];
    const set: SetEntry = {
      id: `set_demo_previous_${item.id}`,
      sessionId: demoSession.id,
      planExerciseId: item.id,
      exerciseId: item.exerciseId,
      setNo: 1,
      edited: false,
      ...(exercise.metric === "reps" ? { reps: item.repsMin ?? 8 } : { seconds: item.secondsMin ?? 30, secondsRaw: item.secondsMin ?? 30 }),
    };
    history.setEntries[set.id] = set;
  }
  return history;
}
