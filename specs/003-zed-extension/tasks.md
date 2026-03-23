---

description: "Task list for 003-zed-extension"
---

# Tasks: VBScript Language Support for Zed Editor

**Input**: Design documents from `/specs/003-zed-extension/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Organization**: Tasks grouped by user story. US1 (Syntax Highlighting) is the MVP.
US2 (Language-Aware Editing) is implemented primarily by the Foundational config files;
Phase 4 verifies correctness. No tests were requested — manual Zed verification is the
acceptance method per quickstart.md.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label (US1, US2)

---

## Phase 1: Setup

**Purpose**: Verify the keyword capture strategy before writing `queries/highlights.scm`.
This is the only technical unknown from research.md — anonymous keyword tokens from `ci()`
patterns may appear as-typed (mixed case), all-lowercase, or need `#match?` predicates.

- [x] T001 Verify anonymous keyword token representation: run `echo 'If x > 0 Then\nEnd If' | npx tree-sitter parse /dev/stdin 2>&1` (or write to a temp file) and examine whether keyword tokens in the parse tree appear lowercase (`if`, `then`) or as-typed (`If`, `Then`). Document the finding as a comment at the top of `queries/highlights.scm` before writing any captures — this determines whether keyword captures need `["if" "then"]`, `["If" "Then"]`, `#match?` predicates, or parent-node structural captures.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create the Zed extension manifest and language configuration. These files
are required before any US1 or US2 work can be loaded in Zed. Both files are independent
and can be written in parallel.

**⚠️ CRITICAL**: `queries/highlights.scm` (Phase 3) cannot be loaded without these files.

- [x] T002 [P] Create `extension.toml` at repository root with: `id = "vbscript"`, `name = "VBScript"`, `version = "0.3.0"`, `schema_version = 1`, `description = "VBScript language support for Zed"`, `repository` pointing to the GitHub URL from `tree-sitter.json`, `authors` from `tree-sitter.json` metadata, `[grammars.vbscript]` block with `repository` = same GitHub URL and `commit` = current HEAD git SHA (run `git rev-parse HEAD`), and `[languages.vbscript]` block with `name = "VBScript"`, `grammar = "vbscript"`, `path_suffixes = ["vbs", "asp"]`, `line_comment = "' "`
- [x] T003 [P] Create `languages/vbscript/config.toml` with: `name = "VBScript"`, `grammar = "vbscript"`, `path_suffixes = ["vbs", "asp"]`, `line_comments = ["' "]`, `tab_size = 4`, `hard_tabs = false`, `brackets = [["(", ")"]]`

**Checkpoint**: Extension manifest and language config created — load as dev extension in
Zed to confirm no load errors before proceeding to highlight queries.

---

## Phase 3: User Story 1 — Syntax Highlighting (Priority: P1) 🎯 MVP

**Goal**: VBScript files display with 9+ distinct highlight categories in Zed.

**Independent Test**: Open any `.vbs` file in Zed dev mode — keywords, strings, comments,
numbers, constants, function names, operators, identifiers, and punctuation all render in
distinct theme-appropriate colors. See quickstart.md Steps 2–9 for specific test inputs.

### Implementation for User Story 1

All tasks write to the same file (`queries/highlights.scm`) and are sequential.

- [x] T004 [US1] Create `queries/highlights.scm` with a header comment documenting the keyword capture strategy (from T001 findings), then add comment captures: `(comment) @comment` and `(rem_comment) @comment`
- [x] T005 [US1] Add string literal captures to `queries/highlights.scm`: `(string_literal) @string`
- [x] T006 [US1] Add numeric and date literal captures to `queries/highlights.scm`: `(number_literal) @number`, `(hex_literal) @number`, `(octal_literal) @number`, `(date_literal) @string.special`
- [x] T007 [US1] Add built-in constant captures to `queries/highlights.scm`: `(boolean_literal) @constant.builtin`, `(nothing) @constant.builtin`, `(empty) @constant.builtin`, `(null) @constant.builtin`
- [x] T008 [US1] Add keyword captures to `queries/highlights.scm` using the strategy confirmed in T001. Include all control-flow keywords (`if`, `then`, `else`, `elseif`, `end`, `for`, `do`, `loop`, `while`, `wend`, `next`, `with`, `select`, `case`) and declaration keywords (`sub`, `function`, `class`, `property`, `dim`, `redim`, `const`, `set`, `let`, `call`, `exit`, `on`, `error`, `resume`, `goto`, `option`, `explicit`, `each`, `in`, `step`, `to`, `preserve`) mapped to `@keyword`. List the most common capitalizations or use `#match?` predicate per T001 findings.
- [x] T009 [US1] Add function, sub, property, and class definition name captures to `queries/highlights.scm`: `(function_declaration name: (identifier) @function)`, `(sub_declaration name: (identifier) @function)`, `(property_get_statement name: (identifier) @function.method)`, `(property_let_statement name: (identifier) @function.method)`, `(property_set_statement name: (identifier) @function.method)`, `(class_statement name: (identifier) @type)`
- [x] T010 [US1] Add operator captures to `queries/highlights.scm`: `(binary_expression operator: _ @operator)`, `(unary_expression operator: _ @operator)`
- [x] T011 [US1] Add identifier, parameter, member property, label, and punctuation captures to `queries/highlights.scm`: `(declared_variable name: (identifier) @variable)`, `(constant_definition name: (identifier) @variable)`, `(parameter name: (identifier) @variable.parameter)`, `(member_expression property: (identifier) @property)`, `(identifier) @variable` (fallback, must be LAST in file), `(line_label label: _ @label)`, `(goto_statement label: _ @label)`, `(on_error_statement label: _ @label)`, `"(" @punctuation.bracket`, `")" @punctuation.bracket`, `"," @punctuation.delimiter`, `":" @punctuation.delimiter`

**Checkpoint**: US1 complete — load dev extension in Zed, open `test_keywords.vbs` from
quickstart.md. Verify all 9 highlight categories are visible before proceeding to US2.

---

## Phase 4: User Story 2 — Language-Aware Editing (Priority: P2)

**Goal**: File type detection, comment toggling, and bracket matching work in Zed.

**Independent Test**: Open `.vbs` file → status bar shows "VBScript". Use "Toggle Line
Comment" → line prefixed with `' `. Place cursor next to `(` → matching `)` highlighted.
See quickstart.md Steps 1, 7, 8.

### Implementation for User Story 2

US2 features are implemented by `languages/vbscript/config.toml` (T003). This phase
verifies completeness and corrects any gaps.

- [x] T012 [US2] Review `languages/vbscript/config.toml` against all US2 requirements: confirm `path_suffixes = ["vbs", "asp"]` (FR-007), `line_comments = ["' "]` (FR-008), and `brackets = [["(", ")"]]` (FR-009) are all present and correctly formatted. If any are missing or wrong, correct them in `languages/vbscript/config.toml`.

**Checkpoint**: US1 + US2 both functional. Full acceptance test using quickstart.md
Verify steps 1–9.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Version bump across all 6 manifests (0.2.0 → 0.3.0). Files are independent —
all 3 version-bump tasks can run in parallel.

- [x] T013 [P] Bump version from `0.2.0` to `0.3.0` in `package.json` (`"version"` field) and `Cargo.toml` (`version =` line)
- [x] T014 [P] Bump version from `0.2.0` to `0.3.0` in `pyproject.toml` (`version =` line) and `tree-sitter.json` (`"version"` field under `"metadata"`)
- [x] T015 [P] Bump version from `0.2.0` to `0.3.0` in `Makefile` (`VERSION :=` line) and `CMakeLists.txt` (`VERSION "..."` in project block)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on T001 finding (T002/T003 can start, but T008 strategy depends on T001)
- **US1 (Phase 3)**: Depends on Phase 2 completion (extension must load before query testing)
- **US2 (Phase 4)**: Depends on Phase 2 completion; T012 may run concurrently with Phase 3
- **Polish (Phase 5)**: Independent of Phases 3–4; can run after Phase 2 completes

### User Story Dependencies

- **US1 (P1)**: Depends on Phase 2 (extension manifest + language config must exist). Independently testable.
- **US2 (P2)**: Depends on Phase 2. T012 is a verification task — mostly done by T003.
  Independently testable (file detection and comment toggle work without highlights.scm).

### Within Phase 3

T004 → T005 → T006 → T007 → T008 → T009 → T010 → T011 (all sequential, same file).
T008 depends on T001 finding for keyword capture strategy.

### Parallel Opportunities

- T002 ‖ T003 (different files, Phase 2)
- T013 ‖ T014 ‖ T015 (different files, Phase 5)
- Phase 5 ‖ Phase 3/4 (version bump files are unrelated to query files)

---

## Parallel Example: Phase 2

```text
# Launch both Phase 2 tasks together:
Task A: "Create extension.toml at repository root" (T002)
Task B: "Create languages/vbscript/config.toml" (T003)

# Launch all Phase 5 version bumps together (after Phase 2):
Task A: "Bump version in package.json and Cargo.toml" (T013)
Task B: "Bump version in pyproject.toml and tree-sitter.json" (T014)
Task C: "Bump version in Makefile and CMakeLists.txt" (T015)
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1: T001 (keyword verification)
2. Complete Phase 2: T002 + T003 in parallel
3. Complete Phase 3: T004 → T011 sequentially
4. **STOP and VALIDATE**: Load dev extension in Zed, verify syntax highlighting works
5. Commit: `feat: add Zed extension syntax highlighting for VBScript`

### Incremental Delivery

1. Phase 1 + Phase 2 → Extension loads in Zed (no highlights yet, but file detection works)
2. Phase 3 (T004–T011) → Syntax highlighting works → MVP complete
3. Phase 4 (T012) → Confirm US2 config is complete
4. Phase 5 (T013–T015) → Version bump
5. Commit: `build: bump version 0.2.0 → 0.3.0 (Zed extension support)`

---

## Notes

- T001 is critical — do not write keyword captures (T008) before running T001
- `queries/highlights.scm` captures are order-sensitive: more specific patterns before less specific; `(identifier) @variable` fallback MUST be the last capture in the file
- The `[grammars.vbscript] commit` in `extension.toml` must be a real git SHA — run `git rev-parse HEAD` after the branch is current
- No corpus test changes needed — grammar.js is unchanged
- Verify with `npx tree-sitter test` after version bumps to confirm nothing broke
