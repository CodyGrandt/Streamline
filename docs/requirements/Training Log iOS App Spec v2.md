# Training Log iOS App Spec

v2 · Oct 21, 2026 · @Jay (supersedes Oct 15 draft)
A native iOS app built with SwiftUI that logs a training day in under a minute and turns the log into progression, volume, and consistency charts.

## Goals and scope

The app replaces the text log. It must be faster to use than typing notes, and it must make progress visible without manual math.
**Must do**

*   Pre-fill each day from the weekly template (Mon pull/push, Tue and Thu progressions, Wed push/row, Fri legs, Sat benchmark, Sun reflection).
    
*   Log sets, reps, holds, rest, session time, and a free-text note with one-tap entry.
    
*   Track the progression ladder per skill (L-sit, handstand, front lever, planche) and the variation used for each hold.
    
*   Show trends, personal records, and weekly consistency.
    
*   Work fully offline, since gym and park sessions often have no signal, and sync through iCloud when a connection returns.
    

**Skip for v1**

*   Social features, coaching, or nutrition tracking.
    
*   An Apple Watch app (a good later addition for wrist timers).
    
*   Accounts or a custom backend. iCloud is the only sync.
    

## Data model

Seven tables cover everything in the current log. Sets are the core record: every hold, rep count, and stretch is one row, so any metric can be computed later.
| Table | Key fields | Purpose |
| --- | --- | --- |
| exercise | id, name, category (skill, strength, stretch), metric (seconds or reps), skill_id, pattern (push, pull, legs, core), lead_in_s (optional override), default_hold_s (stretches), order (within stretch block) | Master list: pike push-ups, dead hang, butterfly, wall handstand |
| progression_level | skill (L-sit, handstand, front lever, planche), rank, name | The ladders already in the log, such as Tucked, Straddle, One Leg, Full |
| template_slot | weekday, block_no, exercise_id, sets_min, sets_max, reps_min, reps_max, rest_min_s, rest_max_s | The weekly template, so each day opens pre-filled |
| session | id, date, weekday, started_at, finished_at, finish_mode (auto, manual), duration_min (computed), note, status (computed), skip_reason, sleep_hours (optional) | One row per training day, including skipped days with a reason |
| set_entry | id, session_id, exercise_id, level_id, set_no, reps, seconds, seconds_raw (decimal), started_at, ended_at, rest_s, equipment, form_flag, edited (bool), rating (1–5, optional) | One row per set or hold |
| weekly_review | week_start, reflection, next_week_goal, reviewed_at (optional), is_stale (bool) | The Sunday reflection and its edit lock |
| settings | lead_in_s (default 3), transition_s (default 5) | App-wide timer defaults, single row |

**Fields worth the extra column**

*   **equipment**: wall, floor, parallettes, bar, dip bars. L-sit results depend heavily on parallel bars being available, so charts should not mix them.
    
*   **level_id**: lets a 20-second tucked hold and a 20-second full hold stay separate.
    
*   **form_flag**: clean, shaky, or bailed. A hold ended by form loss is a different data point than one ended by the clock.
    
*   **seconds vs. seconds_raw**: `seconds` is `floor(elapsed)` and is what charts and PRs use. `seconds_raw` keeps the decimal so the rounding rule can be revisited later.
    
*   **edited**: true when a number was corrected by hand, so timed and corrected holds are distinguishable in analytics.
    
*   **status on session**: done, partial, or skipped. Computed, not typed: done = every planned slot has at least one set; partial = some; skipped = none, with a one-word reason (travel, sleep, injury).
    
*   **reviewed_at / is_stale on weekly_review**: saving the Sunday reflection sets `reviewed_at`. Any later edit to that week's sessions sets `is_stale` so the draft can be regenerated.
    

**Rules for syncing with iCloud**

*   Each table becomes a SwiftData model (a Swift class), and the fields above become its properties.
    
*   Give every property a default value or make it optional, and make relationships optional. CloudKit requires this.
    
*   Do not use unique constraints. Enforce uniqueness in code instead, for example one exercise per name and one session per date.
    

## Logging flow

The goal is three taps or fewer per set, with last session's numbers visible so every set has a target to beat. All timers compute elapsed time from timestamps, never from counting ticks.

1.  **Today screen.** Opens to the weekday's template with a Start button. Each exercise shows last session's result in grey beside the target range. Tapping Start records `started_at`.
    
2.  **Rep exercises.** A stepper starts at last time's reps. Tap to adjust, tap Done, and the rest timer starts using the template's rest range.
    
3.  **Holds.**
    *   Tapping Start begins a lead-in countdown (default 3 s, configurable in Settings, overridable per exercise) so you can get into position. Each second ticks with a haptic; a distinct haptic and sound mark zero, when the stopwatch starts from 0.
        
    *   Tapping Stop records `floor(elapsed)` as `seconds`, since reaching the button takes time. The raw decimal is kept in `seconds_raw`.
        
    *   On stop, one tap picks clean, shaky, or bailed.
        
    *   Level and equipment default to the last values used and change with one tap.
        
    *   The recorded number is a tappable field. Editing it sets `edited = true`.
        
    *   Undo deletes the set entirely; use Edit to fix the number.
        
    *   The rest timer starts automatically after the form flag.
        
4.  **Stretches.** The stretch block runs as a guided sequence.
    *   Tap Start on the block. The first stretch counts down its `default_hold_s`, cues at zero, then a transition countdown (default 5 s, configurable) runs before the next stretch starts automatically.
        
    *   Stretches run in `order`. Long-press a stretch to change its time; Skip logs it with a reason.
        
    *   An optional 1–5 depth rating is prompted at the end of key stretches (straddle, toe touch, pancake).
        
5.  **Finish.**
    *   When the last stretch's timer completes, the session finishes automatically. `finished_at` is set and `duration_min` is computed from `started_at`.
        
    *   A manual Finish button remains for days with no stretch block or when stretches are abandoned.
        
    *   The summary screen then shows new PRs and offers a note (voice dictation) and optional sleep hours. These are post-finish and editable later; nothing blocks the end of the session.
        
    *   Auto-finish with an incomplete hold block yields status `partial`.
        
6.  **Sunday review.** The app drafts the week: sessions done versus planned, new personal records, and skipped days with reasons. You add the reflection and next week's goal. Saving sets `reviewed_at`.
    

**Behaviors that keep it usable**

*   Offline first: sets save locally and sync when the connection returns.
    
*   Undo on every set; Edit on every recorded number.
    
*   Editable through the Sunday review: all days in the current week stay freely editable until the Sunday reflection is saved. After that, edits still work but prompt a confirmation and set `is_stale = true` on the weekly review so the draft can be regenerated. Prior weeks follow the same rule.
    
*   Skipped days take one tap and a reason, so gaps are recorded instead of left blank.
    
*   Screen stays awake while any lead-in, hold, rest, or transition timer is running.
    
*   The Live Activity shows whichever timer is currently active.
    

## Analytics

Hold times are noisy day to day, so charts show the best hold per session with a 3-session rolling best, never a raw average. Holds that ended in a bail are marked, not hidden.
| Chart or metric | Data used | What it answers |
| --- | --- | --- |
| Skill hold trend | Best hold per session, per skill, filtered by level and equipment | Is my handstand or L-sit hold actually growing? |
| Level-up readiness | Clean holds at the current level, with a configurable rule (default: 3 clean holds of 15 seconds in 3 of the last 4 sessions) | When should I move to the next variation? |
| Strength trend | Best set and total reps per exercise | Are pike push-ups, pull-ups, and rows going up? |
| Weekly hard sets | Sets grouped by `pattern` (push, pull, legs, core) | Is any pattern under-trained or overloaded? |
| Consistency calendar | Session status by day, with skip reasons | Which weeks slipped, and why? |
| Session length | duration_min against a target line | Is leg day staying near 25 minutes? |
| Benchmark Saturday | Best of two per skill, weekly | The cleanest signal of progress, under the same conditions each week |
| Sleep versus performance | sleep_hours against next-day best hold | Does sleep change my holds? Shown only after 8 or more weeks of data |

**Personal records**
A PR is the longest clean hold or the highest rep count at a given level and equipment. Show new PRs on the finish screen and in the Sunday review.
**Mobility**
Seconds held is a weak signal for flexibility. The optional 1 to 5 depth rating on key stretches (straddle, toe touch, pancake) is charted over time.

## Stack and architecture

Build it as a native iOS app in Swift and SwiftUI, with no backend. Data lives on the phone in SwiftData and syncs through your own iCloud account, so there is no server to run and no login screen. The minimum is iOS 17, which SwiftData needs; raise it to match your phone.
| Layer | Choice | Reason |
| --- | --- | --- |
| Language and UI | Swift and SwiftUI | Apple's current native stack. SwiftUI is declarative like React, and Swift's optionals and protocols will feel familiar from C# and TypeScript |
| Local storage | SwiftData | A database built into iOS that works offline by default |
| Sync | SwiftData with CloudKit (your private iCloud database) | Syncs between devices with no backend and no account system |
| Charts | Swift Charts | Apple's built-in charts with line, bar, point, and rule marks, and automatic dark mode |
| Lock screen timers | ActivityKit (Live Activities) | Shows the lead-in, hold, rest, or transition countdown on the lock screen and Dynamic Island |
| Rest alerts | Local notifications and haptics | Alerts when rest ends, even with the app in the background |
| Home screen | WidgetKit | A widget with today's plan and this week's consistency |
| Quick logging | App Intents and Shortcuts | Log a set from Siri, the Action button, or a Shortcut |
| Health data | HealthKit (optional) | Reads sleep hours instead of typing them, and can save sessions as workouts |
| Testing | Swift Testing and Xcode previews | Unit tests for the PR, level-up, status, and rounding math, plus live previews of each screen |

**What you need and what to watch for**

*   **A Mac with Xcode.** iOS apps cannot be built without one.
    
*   **Apple Developer Program.** Membership costs $99 per year and is needed for iCloud sync and TestFlight. A free account installs to your own phone, but the app expires after 7 days and, as far as I know, cannot use iCloud.
    
*   **Timers.** Compute elapsed time from timestamps, not from counting ticks. A Live Activity's countdown text keeps running on the lock screen without the app updating it.
    
*   **App Group.** The widget and Live Activity extension need an App Group to read the SwiftData store. Set it up in phase 1; it is painful to retrofit.
    
*   **Seeding.** Seed the default exercise list with fixed UUIDs so two devices do not create duplicates before first sync.
    
*   **Screen on.** Disable the idle timer while any timer is running, so the screen does not lock mid-set.
    
*   **Haptics.** Use SwiftUI's sensory feedback for countdown ticks, rest-end buzzes, and new PRs.
    
*   **Touch targets.** Make Start, Stop, and the rep stepper at least 44 points, Apple's minimum, and larger where you can.
    
*   **Export.** Add a JSON and CSV export through the share sheet from day one, so your history is never locked in. The importer in phase 2 should emit the same JSON shape so one format round-trips.
    

## Build phases

Ship logging first and import your history before building charts, so the analytics have nine weeks of real data from the first day.
| Phase | Deliverable | Done when |
| --- | --- | --- |
| 1. Foundations | Xcode project, SwiftData models, App Group, Today screen from the template, rep stepper, hold stopwatch with lead-in and floor rounding, guided stretch sequence with transitions, rest timer, auto-finish | You can log a full Friday leg day in airplane mode and the data is still there after a restart |
| 2. History import | A one-off script that turns the text log into a JSON file, plus an Import screen in the app that reads it | Weeks 1 to 9 appear in the app, with unclear lines listed for review |
| 3. Analytics | Swift Charts for hold trend, strength trend, consistency calendar, session length, and PRs | Every chart in the Analytics section renders from real data |
| 4. Review and rules | Sunday review draft with edit lock and stale flag, level-up readiness rule, benchmark Saturday view, Live Activity and notifications | The Sunday screen drafts itself and flags skills ready to progress |
| 5. Sync and polish | iCloud sync, home screen widget, export, HealthKit sleep, mobility ratings | Your data appears on a second device or after a reinstall |

**Importing the existing log**
The log is free text, so the importer should flag anything it cannot parse instead of guessing. Write it as a one-off Python script that outputs JSON, and keep the parsing out of the app.

*   **Dates.** Week 1 starts Tuesday, 2026-08-18, and the dates written in later weeks (9/19, 9/22) match that count, so every entry can be dated from its week and weekday.
    
*   **Sets.** Parse comma lists such as 8,8,8 into separate sets. Flag typos such as "8,88" and "5,5,55", and entries such as "3x8" or "30 (bent)", which carry a level or a set count.
    
*   **Levels.** Map "bent", "no p bar", and "facing wall" to level and equipment values, since they change what the number means.
    
*   **Skipped days.** Entries with no numbers become skipped sessions, and sentences like "played minecraft instead" or "at the beach" fill the skip reason.
    
*   **Notes.** Keep the written reflections as session notes, unedited.
    
*   **Idempotence.** Every imported row carries an `import_key` so re-running the script does not duplicate data.
    

## Open decisions

*   Do you have a Mac with Xcode and an iPhone on iOS 17 or later? This plan assumes both.
    
*   Pay for the Apple Developer Program now for iCloud sync, or ship local-only first and add sync in phase 5?
    
*   Skill as a table or an enum? A table is more flexible; an enum is less code.
    
*   Week start: Monday (template) or Tuesday (log history)?
    
*   Side-specific stretches (left/right): two entries with a transition between them, or one entry with a double-length hold?
    
*   Should the lead-in also apply to rep exercises as a "get set" cue, or holds only?
    
*   Does the transition countdown also run between the stretch block and the hold blocks, or only within the stretch block?
    
*   Level-up threshold: one rule for all skills, or per skill and level? 15 seconds means different things for a wall handstand and a tucked front lever.
    
*   Rest timer: record planned or actual rest when the next set starts early? (Recommend actual, from timestamps.)
    
*   Day boundary for late sessions: midnight, or a configurable cutoff such as 4 am?
