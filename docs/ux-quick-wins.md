# GEM UX Quick Wins

Backlog of small, high-impact improvements intended to reduce daily friction in GEM. The order below is the agreed implementation order; items remain independent unless noted otherwise.

## Prioritized backlog

| Status | # | Improvement | Expected benefit |
|---|---:|---|---|
| Completed | 4 | Clearer feedback | Users always know when an action is saving, completed, or failed. |
| Completed | 1 | Command palette + global search (`Ctrl+K`) | Reach screens, actions, and records from one keyboard-driven surface. |
| Completed | 2 | Global search | Implemented as the record-search part of the command palette rather than a separate destination. |
| Revisit | 3 | Quick table actions | Add only genuinely useful shortcuts; do not hide a small set of clear row actions behind a menu. |
| Completed (first slice) | 5 | Useful empty states | Explain why there are no results and offer the next useful action. |
| Planned | 6 | Recently visited screens | Return quickly to recently opened records and views. |
| Planned | 7 | Favorites | Pin frequently used projects, clients, or views. |
| Completed | 8 | Keyboard improvements | Make common actions faster with predictable shortcuts. |

## Item 4 — Clearer feedback

### Product goal

Make every frequent operation communicate its state clearly:

- **Saving:** the action is in progress and cannot be accidentally duplicated.
- **Success:** the change was accepted and the user knows what changed.
- **Error:** the operation failed and the user knows what to do next.
- **Loading:** the screen explains that data is being retrieved rather than appearing empty.

### Covered flows

- Reuse the existing toast and confirmation patterns.
- Add busy/disabled states to the most frequent save and update actions.
- All `TrabajarCon` screens with direct create, update, or delete requests, including roles, projects, modules, stages, event types, events, work-hour records, knowledge bases, parameters, reports, products, clients, environments, users, and news archiving.
- All `CrudFormModal` submit buttons now consume `submitting` while preserving their existing validation.
- KB deploy create/update/delete and client credential create/rotate/toggle flows now expose their in-progress state.
- Existing `LoadingService` and table loading states remain unchanged; no global loading refactor was introduced.
- Keep error messages actionable and avoid exposing technical details.

### Acceptance checklist

- [x] A repeated click cannot submit or directly delete the same operation while it is in progress.
- [x] Successful updates show a concise confirmation through the existing CRUD flow.
- [x] Failed updates show a clear recovery message and re-enable the form.
- [x] Existing forms preserve their current validation behavior.
- [x] The first slice does not change unrelated business logic.

The special flows are covered with behavior-specific local states:

- Preferences queue the latest autosave and restore the last persisted list on failure.
- Password, profile, additional-data, token, note, priority-rule, and inline event-date actions expose progress, success/error feedback, and duplicate-action guards.

## Out of scope

- Replacing the notification library.
- Redesigning the complete visual language.
- Adding global search or command-palette behavior as part of item 4.

## Item 5 — Useful empty states

### Completed first slice

Added and validated native empty-state extensions to the following screens:

- Users, clients, and projects: distinguish empty datasets from PrimeNG search/column, active-status, and role-filter results; show permitted create actions for empty datasets.
- Events: distinguish empty datasets from active status, date-range, search, and column filters; expose `Limpiar filtros` for filtered results.
- Work-hour records: cover the outer user table while preserving nested table empty states; distinguish the date-range/search result state and expose `Limpiar filtros`.
- Notes: add an Angular `@empty` state with the existing `Nueva nota` action.

### Pending scope

- Review the remaining list and nested-table screens and apply the same treatment where their existing state allows a reliable distinction.
- Events and work-hour records have date ranges initialized by default, so an empty response is reported as a filtered result for that range rather than as a global dataset-empty state.

## Item 8 — Keyboard improvements

### Verified

- `DynamicDialog` defaults explicitly enable `closeOnEscape`, `focusOnShow`, `focusTrap`, and modal behavior.
- CRUD forms retain Enter submission through `(ngSubmit)`, expose a visible `Cancelar` action, and mark save requests with `aria-busy`.
- CRUD dialogs disable X/Escape and the visible cancel action while a save request is pending; the original dialog configuration is restored in `finalize()`.
- Evento auxiliary buttons explicitly use `type="button"` and provide accessible labels and tooltips.

### Intentional exceptions

- Parameter view mode keeps its existing `Cerrar` action instead of adding an editable-form `Cancelar` action.
- Existing special modal flows outside `CrudFormModal` were not changed because they have different close/request contracts.

## Items 1 and 2 — Command palette and global search

The current `desa` environment includes the functional command palette and global-search flow in `src/app/components/command-palette`, backed by the API search module. It uses the installed PrimeNG dialog and input components and does not install or update PrimeNG.

> Compatibility note: the current project uses PrimeNG `21.0.0-beta.1`, while the referenced `CommandMenu` documentation is for the newer PrimeNG site. The installed version does not currently expose `primeng/commandmenu`, so implementation must either upgrade PrimeNG deliberately or reproduce the same interaction with supported components.

- **Commands:** navigation, creation actions, preferences, and session actions.
- **Records:** users, clients, projects, events, and other searchable entities.
- **Default view:** recent commands and frequent actions.
- **Typed search:** filter local commands first; query records asynchronously when the input is specific enough.
- **Keyboard contract:** `Ctrl+K`/`Cmd+K` opens the dialog, arrows move through results, `Enter` executes, and `Escape` closes it.
- **Boundary:** the palette is the shared entry point and command definitions remain separate from the visual component. The delivered search flow now queries the API for supported records.
