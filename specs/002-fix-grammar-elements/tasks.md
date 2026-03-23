# Tasks: Fix Missing VBScript Grammar Elements

**Input**: Design documents from `/specs/002-fix-grammar-elements/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

**Tests**: Not a TDD project — grammar changes are verified by running `npx tree-sitter test`.
Each user story phase ends with a full test run to validate the story's acceptance criteria.

**Organization**: Tasks are grouped by user story. All grammar changes are in the single
`grammar.js` file and must be applied sequentially. Corpus test additions to different
files within a user story CAN be done in parallel [P].

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1–US4)
- All grammar changes are in `grammar.js` at the repository root
- All corpus tests are in `test/corpus/`

## Path Conventions

- Grammar: `grammar.js` at repository root
- Corpus tests: `test/corpus/` at repository root
- Generated files (do NOT edit manually): `src/parser.c`, `src/grammar.json`, `src/node-types.json`
- Reference `specs/002-fix-grammar-elements/research.md` for implementation decisions
- Reference `specs/002-fix-grammar-elements/quickstart.md` for expected parse trees

---

## Phase 1: Setup

**Purpose**: Establish baseline before any changes

- [ ] T001 Run `npx tree-sitter test` at the repository root and confirm: exactly 132 tests pass and exactly 12 tests are skipped (`:skip`); zero ERROR nodes in any passing test. Record this count as the regression baseline before making any changes.

**Checkpoint**: Baseline confirmed — 132 pass, 12 skip.

---

## Phase 2: User Story 1 — Fix Core Control Flow Parsing (Priority: P1) 🎯 MVP

**Goal**: `If...End If`, `ElseIf`, `Else`, and `Option Explicit` parse correctly as block
constructs. Root cause: `/[\s\t]/` in `extras` consumes `\n`, so `_terminator` never fires.

**Independent Test**: Run `npx tree-sitter test` — the tests added in T004 and T005 pass
with no `:skip`, no ERROR nodes, and all 132 previously passing tests still pass.

### Implementation for User Story 1

- [ ] T002 [US1] In `grammar.js` line 21, change the `extras` array entry from `/[\s\t]/` to `/[ \t]/` (literal space and tab only). The `extras` array should read: `extras: $ => [$.comment, /[ \t]/, $.line_continuation]`. Do NOT change any other part of the file.

- [ ] T003 [US1] Run `npx tree-sitter generate` at the repository root. Verify it completes with zero errors. Then immediately run `npx tree-sitter test` to check for regressions — the 132 previously passing tests MUST still pass. If any existing test breaks due to the extras change, fix the expected S-expression in that test file using `npx tree-sitter test --update --file-name "<failing-file>.txt"`, review the diff, and commit the correction.

- [ ] T004 [P] [US1] Add block_if_statement corpus tests to `test/corpus/control_flow.txt`. Append three new tests at the end of the file:
  1. **"Block If simple"** — input: `If x > 0 Then\n  y = 1\nEnd If`, expected: `source_file > statement_line > statement_group > block_if_statement` with `binary_expression` condition and inner `statement_line` body containing `expression_statement(assignment_expression(identifier, number_literal))`
  2. **"Block If with ElseIf"** — input: `If x = 1 Then\n  a = 1\nElseIf x = 2 Then\n  a = 2\nEnd If`, expected: `block_if_statement` with `elseif_clause` child containing the ElseIf condition and body
  3. **"Block If with ElseIf and Else"** — input: `If x = 1 Then\n  a = 1\nElseIf x = 2 Then\n  a = 2\nElse\n  a = 3\nEnd If`, expected: `block_if_statement` with `elseif_clause` AND `else_clause` children

  Use `npx tree-sitter parse` or `npx tree-sitter test --update --file-name "control_flow.txt"` to capture the exact S-expression output from the fixed parser. The expected trees in `known_failures.txt` have comment lines in the input which add empty `statement_line` nodes — write CLEAN inputs (without embedded comments) in the new tests.

- [ ] T005 [P] [US1] Add `option_explicit_statement` corpus test to `test/corpus/declarations.txt`. Append one new test: **"Option Explicit statement"** — input: `Option Explicit`, expected: `(source_file (option_explicit_statement))`. Verify the node is `option_explicit_statement` (not `implicit_call_statement`). Use `npx tree-sitter parse` to confirm.

- [ ] T006 [US1] In `test/corpus/known_failures.txt`, remove the three `:skip` test blocks for: "Option Explicit statement", "Block If statement", and "Block If with ElseIf". Keep the remaining 9 skipped tests (boolean literals, nothing, empty, null, assignment, hex, octal, date) unchanged.

- [ ] T007 [US1] Run `npx tree-sitter test` — verify: (a) all 132 previously passing tests still pass, (b) the 3 new US1 tests pass with zero ERROR nodes, (c) the 9 remaining skipped tests stay skipped. Total: 135+ passing, 9 skipped.

**Checkpoint**: Block If, ElseIf, Else, and Option Explicit parse correctly. US1 is independently validated.

---

## Phase 3: User Story 2 — Fix Keyword Literal Parsing (Priority: P2)

**Goal**: `True`, `False`, `Nothing`, `Empty`, `Null` parse as their correct node types
instead of `identifier`. Root cause: missing `word: $ => $.identifier` property.

**Independent Test**: Run `npx tree-sitter test` — the 5 tests added in T009 pass without
`:skip`, each showing the correct node type (not `identifier`), with zero regressions.

### Implementation for User Story 2

- [ ] T008 [US2] In `grammar.js`, add `word: $ => $.identifier` as a top-level grammar property immediately after the `extras` array and before the `precedences` array. The grammar object should have: `name`, `extras`, `word`, `precedences`, `conflicts`, `supertypes`, `rules` in that order. Do NOT change any other part of the file.

- [ ] T009 [US2] Run `npx tree-sitter generate` at the repository root. Verify zero errors. Run `npx tree-sitter test` immediately — the 135+ previously passing tests MUST still pass. If any test breaks (e.g., any test that uses `True`/`False`/`Nothing`/`Empty`/`Null` as expression_statement children), update its expected S-expression with the correct node type using `--update`.

- [ ] T010 [P] [US2] Add keyword literal corpus tests to `test/corpus/literals.txt`. Append five new tests:
  1. **"Boolean literal True"** — input: `x = True`, expected: the right operand is `(boolean_literal)` not `(identifier)`. Note: `x = True` after BOTH US2 and US3 fixes produces `assignment_expression`, but after US2 alone (no assignment fix yet), it still produces `binary_expression(identifier, boolean_literal)`. Write the test to match the parser output after US2 (use `npx tree-sitter parse` to capture actual output).
  2. **"Boolean literal False"** — input: `x = False`, same structure as True.
  3. **"Nothing literal"** — input: `Set obj = Nothing`, expected: `set_statement` with `(nothing)` node on the right.
  4. **"Empty literal"** — input: `x = Empty`, expected: right side is `(empty)` node.
  5. **"Null literal"** — input: `x = Null`, expected: right side is `(null)` node.

  Use `npx tree-sitter parse` after T009 to capture exact S-expressions.

- [ ] T011 [US2] In `test/corpus/known_failures.txt`, remove the five `:skip` test blocks for: "Boolean literal True", "Boolean literal False", "Nothing literal", "Empty literal", and "Null literal". Keep the remaining 4 skipped tests (assignment, hex, octal, date) unchanged.

- [ ] T012 [US2] Run `npx tree-sitter test` — verify: (a) all previously passing tests still pass, (b) the 5 new US2 keyword literal tests pass with correct node types (not `identifier`), (c) the 4 remaining skipped tests stay skipped. Total: 140+ passing, 4 skipped.

**Checkpoint**: `True`, `False`, `Nothing`, `Empty`, `Null` parse with correct node types. US2 independently validated.

---

## Phase 4: User Story 3 — Fix Assignment Expression Parsing (Priority: P3)

**Goal**: `x = 5` as a statement produces `assignment_expression`, while `x = 5` in a
condition produces `binary_expression`. Also fixes the member_expression bug where
`x = obj.Name` was producing the wrong tree.

**Independent Test**: Run `npx tree-sitter test` — `x = 5` produces `assignment_expression`,
`If x = 5 Then` retains `binary_expression` for the condition, and `obj.prop = value`
produces `assignment_expression` with `member_expression` LHS.

### Implementation for User Story 3

- [ ] T013 [US3] In `grammar.js`, make three changes to fix assignment disambiguation:
  1. Change `expression_statement: $ => $._expression` to `expression_statement: $ => choice(prec.dynamic(1, $.assignment_expression), $._expression)`. This makes `expression_statement` prefer `assignment_expression` over plain `_expression` when both are valid.
  2. In `_expression`, remove `$.assignment_expression` from the `choice()`. The `_expression` rule should no longer include assignment — assignment is only valid at statement level.
  3. In the `conflicts` array, remove the two pairs: `[$._expression, $._lvalue]` and `[$._primary_expression, $._lvalue]`. These conflicts were specifically for the expression/lvalue ambiguity in the old assignment-in-expression approach. Removing them reduces the conflict count from 8 to 6.

  If `tree-sitter generate` reports a new conflict for `[$.assignment_expression, $.expression_statement]`, add it to the `conflicts` array with an explanatory comment.

- [ ] T014 [US3] Run `npx tree-sitter generate` at the repository root. Verify zero errors. If a new conflict warning appears about `assignment_expression` vs `expression_statement`, add the required conflict entry to `grammar.js` and regenerate. Run `npx tree-sitter test` — all previously passing tests must still pass. If existing tests show `assignment_expression` trees where they previously showed `binary_expression`, update those tests with `--update` (e.g., any `x = expr` test that was previously written against the buggy parser output).

- [ ] T015 [P] [US3] Add assignment expression corpus tests to `test/corpus/expressions.txt`. Append five new tests:
  1. **"Assignment without Let"** — input: `x = 5`, expected: `expression_statement(assignment_expression(identifier, number_literal))` — NOT `binary_expression`.
  2. **"Assignment Let and no-Let identical trees"** — input: `Let x = 5`, expected: same `assignment_expression` tree (verify `Let` and no-`Let` produce identical S-expressions).
  3. **"Comparison in If condition not broken"** — input: `If x = 5 Then y = 1`, expected: `single_line_if_statement` where condition field is `binary_expression` (comparison `=`) and consequence contains `assignment_expression`.
  4. **"Member expression LHS assignment"** — input: `obj.prop = value`, expected: `expression_statement(assignment_expression(member_expression(identifier, identifier), identifier))` — no binary_expression wrapping.
  5. **"Call expression LHS assignment (array subscript)"** — input: `arr(i) = value`, expected: `expression_statement(assignment_expression(call_expression(...), identifier))`.

  Use `npx tree-sitter parse` after T014 to capture exact S-expressions.

- [ ] T016 [US3] In `test/corpus/known_failures.txt`, remove the one `:skip` test block for "Assignment expression without Let". Keep the remaining 3 skipped tests (hex, octal, date) unchanged.

- [ ] T017 [US3] Run `npx tree-sitter test` — verify: (a) all previously passing tests still pass (especially any `For i = 1 To 10` test — the `=` there must remain part of `for_statement` syntax, NOT become `assignment_expression`), (b) the 5 new US3 assignment tests pass, (c) the 3 remaining skipped tests stay skipped, (d) count conflict pairs in `grammar.js` — should be 6 or fewer. Total: 145+ passing, 3 skipped.

**Checkpoint**: `x = 5` → `assignment_expression`. `If x = 5` → comparison. Member/subscript LHS works. US3 independently validated.

---

## Phase 5: User Story 4 — Add Missing Literal Types (Priority: P4)

**Goal**: Hex (`&HFF`), octal (`&O77`), and date/time (`#1/1/2000#`) literals parse as
distinct named node types without ERROR nodes.

**Independent Test**: Run `npx tree-sitter test` — `x = &HFF` → `hex_literal`, `x = &O77`
→ `octal_literal`, `x = #1/1/2000#` → `date_literal`, all with zero ERROR nodes.

### Implementation for User Story 4

- [ ] T018 [US4] In `grammar.js`, add three new terminal rules and register them in `_primary_expression`:
  1. Add `hex_literal: $ => /&[hH][0-9a-fA-F]+/` in the Terminals section (after `number_literal`).
  2. Add `octal_literal: $ => /&[oO][0-7]+/` after `hex_literal`.
  3. Add `date_literal: $ => /#[^#\n\r]+#/` after `octal_literal`.
  4. In `_primary_expression`, add `$.hex_literal`, `$.octal_literal`, and `$.date_literal` to the `choice()` alongside `$.number_literal`. The `_primary_expression` rule must include all literal types so they're reachable from `_expression`.

- [ ] T019 [US4] Run `npx tree-sitter generate` at the repository root. Verify zero errors. Run `npx tree-sitter test` — all previously passing tests must still pass. The `&` character is now used as both the concatenation operator and the hex/octal prefix; the lexer should prefer `hex_literal`/`octal_literal` over the `&` concatenation token when `[hH]`/`[oO]` follows the `&`. If any test breaks due to `&` tokenization, investigate and fix.

- [ ] T020 [P] [US4] Add hex_literal corpus tests to `test/corpus/literals.txt`. Append three new tests:
  1. **"Hex literal uppercase H"** — input: `x = &HFF`, expected: `assignment_expression(identifier, hex_literal)`.
  2. **"Hex literal large value"** — input: `x = &H80000000`, expected: `assignment_expression(identifier, hex_literal)`.
  3. **"Hex literal lowercase h"** — input: `x = &hff`, expected: same `assignment_expression(identifier, hex_literal)` (case-insensitive prefix).

  Use `npx tree-sitter parse` after T019 to capture exact S-expressions. Note: these tests depend on US3 being applied (so `x = &HFF` produces `assignment_expression`, not `binary_expression`).

- [ ] T021 [P] [US4] Add octal_literal corpus tests to `test/corpus/literals.txt`. Append two new tests:
  1. **"Octal literal"** — input: `x = &O77`, expected: `assignment_expression(identifier, octal_literal)`.
  2. **"Octal literal lowercase o"** — input: `x = &o0`, expected: `assignment_expression(identifier, octal_literal)`.

- [ ] T022 [P] [US4] Add date_literal corpus tests to `test/corpus/literals.txt`. Append two new tests:
  1. **"Date literal simple"** — input: `x = #1/1/2000#`, expected: `assignment_expression(identifier, date_literal)`.
  2. **"Date literal with time"** — input: `x = #12/31/1999 11:59:59 PM#`, expected: `assignment_expression(identifier, date_literal)`.

  **Note**: T020, T021, T022 all append to the SAME file (`test/corpus/literals.txt`). Execute them sequentially or batch all three additions into a single edit.

- [ ] T023 [US4] In `test/corpus/known_failures.txt`, remove the three remaining `:skip` test blocks: "Hex literal", "Octal literal", and "Date literal". After this removal, `known_failures.txt` should contain only the comment header — no `:skip` tests remain.

- [ ] T024 [US4] Run `npx tree-sitter test` — verify: (a) all previously passing tests still pass, (b) the 7 new US4 literal tests (3 hex + 2 octal + 2 date) pass with zero ERROR nodes, (c) `known_failures.txt` has zero `:skip` tests, (d) `tree-sitter test` exits with code 0. Total: 152+ passing, 0 skipped.

**Checkpoint**: All literal types parse correctly. All 12 known_failures promoted. Zero skipped tests. US4 independently validated.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Version bump, final validation, and cleanup

- [ ] T025 Bump version from `0.1.0` to `0.2.0` in all 6 manifest files (MINOR bump: new node types added to node-types.json). Files to update: `package.json` (change `"version": "0.1.0"` to `"0.2.0"`), `Cargo.toml` (change `version = "0.1.0"` to `"0.2.0"`), `pyproject.toml` (change `version = "0.1.0"` to `"0.2.0"`), `tree-sitter.json` (change `"version": "0.1.0"` to `"0.2.0"`), `Makefile` (find version variable and update), `CMakeLists.txt` (find version line and update).

- [ ] T026 [P] Verify `test/corpus/known_failures.txt` has zero `:skip` markers remaining. The file should contain only the comment header (lines 1–5 with `'` prefix). If any `:skip` tests remain, they indicate a test that was not promoted — either promote it or document why it was not promoted.

- [ ] T027 [P] Run final validation per `specs/002-fix-grammar-elements/quickstart.md`: execute each `npx tree-sitter parse` command listed in the quickstart and verify the output matches the expected S-expression trees for all 4 fix categories. Document any discrepancies found.

- [ ] T028 Run full `npx tree-sitter test` as the definitive acceptance gate. Verify: (a) all SC-001 through SC-004 success criteria are met — 9+ formerly skipped tests now pass, 6+ new literal tests pass, 132 previously passing tests still pass, 100% pass rate, (b) SC-005 — conflict pair count in `grammar.js` is ≤ 8 (target ≤ 6), (c) zero ERROR nodes in ANY passing test's expected S-expression, (d) `tree-sitter test` exits with code 0.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — verify baseline immediately.
- **US1 (Phase 2)**: Depends on Phase 1. Can start after baseline confirmed. No dependencies on US2–US4.
- **US2 (Phase 3)**: Depends on Phase 1. Can start after baseline confirmed. No dependency on US1 (word property is independent of extras fix). However, grammar.js changes must be applied sequentially — if working alone, complete US1 grammar changes before starting US2.
- **US3 (Phase 4)**: Depends on Phase 1. Independent of US1 and US2. Grammar.js changes sequential.
- **US4 (Phase 5)**: Depends on Phase 1. Independent of US1–US3 for grammar changes. Corpus tests for US4 (T020–T022) reference `assignment_expression` trees which require US3 to be applied first — if testing US4 before US3, expected trees will show `binary_expression` instead. Recommended order: apply all grammar.js changes first, generate once, then write all corpus tests.
- **Polish (Phase 6)**: Depends on all user story phases completing successfully.

### User Story Dependencies

- **US1 (P1)**: Independent. Extras fix only.
- **US2 (P2)**: Independent. Word property only.
- **US3 (P3)**: Independent. Assignment restructure only.
- **US4 (P4)**: Independent for grammar changes. Corpus test expected trees depend on US3 (assignment fix) being in place if testing incrementally.

### Within Each User Story

- Grammar edit → `generate` → regression check → corpus tests → remove from known_failures → final test run.
- T004 and T005 (within US1) can be done in parallel (different files).
- T020, T021, T022 (within US4) modify the same file — do sequentially or batch in one edit.

### Parallel Opportunities

- **Within US1**: T004 [P] and T005 [P] write to different files — run in parallel.
- **Within US2**: T010 [P] adds to one file — single task, no parallelism needed.
- **Within US3**: T015 [P] adds to one file — single task.
- **Within US4**: T020 [P], T021 [P], T022 [P] are marked [P] but write to the same file — batch into one edit pass. The [P] marker indicates they're logically independent.
- **Polish**: T026 [P] and T027 [P] can run in parallel with each other.
- **All user stories**: If applying all grammar changes at once (recommended for solo implementation), you can: (1) apply all 4 grammar changes to `grammar.js`, (2) run `npx tree-sitter generate` once, (3) write all corpus tests in parallel, (4) run `npx tree-sitter test` once.

---

## Parallel Example: Batch Implementation (Recommended for Solo)

```bash
# Step 1: Apply ALL grammar changes to grammar.js at once
# - extras: /[\s\t]/ → /[ \t]/
# - add word: $ => $.identifier
# - restructure expression_statement + _expression + remove 2 conflicts
# - add hex_literal, octal_literal, date_literal + _primary_expression

# Step 2: Generate once
npx tree-sitter generate

# Step 3: Run full test suite to check for regressions
npx tree-sitter test

# Step 4: Write all corpus test additions in parallel
# - test/corpus/control_flow.txt (3 block_if tests)
# - test/corpus/declarations.txt (1 option_explicit test)
# - test/corpus/literals.txt (12 tests: 5 keyword + 3 hex + 2 octal + 2 date)
# - test/corpus/expressions.txt (5 assignment tests)

# Step 5: Remove all 12 entries from known_failures.txt

# Step 6: Run tree-sitter test — expect 152+ passing, 0 skipped

# Step 7: Version bump in all 6 manifests
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Baseline verification (T001)
2. Complete Phase 2: US1 — Block construct fix (T002–T007)
3. **STOP and VALIDATE**: Run `npx tree-sitter test` — block_if, elseif_clause, else_clause, option_explicit_statement now pass.
4. This alone makes multi-line If statements parse correctly — the most impactful bug fix.

### Incremental Delivery

1. US1 (extras fix) → validate → 3 fewer skipped tests
2. US2 (word property) → validate → 5 fewer skipped tests
3. US3 (assignment fix) → validate → 1 fewer skipped test
4. US4 (literal types) → validate → 3 fewer skipped tests (+ 7 new tests)
5. Polish → version bump → 0 skipped tests total

### Batch Delivery (Most Efficient)

Apply all 4 grammar changes at once → generate once → write all corpus tests → run once.
This is the recommended approach for a single developer working on this feature.

---

## Notes

- All grammar changes are in ONE file: `grammar.js`
- All test changes are in `test/corpus/` (no changes to `src/` — those are generated)
- After EACH `tree-sitter generate`, run `tree-sitter test` immediately to catch regressions
- Use `npx tree-sitter parse` to verify individual inputs: `printf "x = True\n" | npx tree-sitter parse --stdin`
- The `--update` flag on `tree-sitter test` auto-fills expected trees from parser output
- Commit after each user story phase with appropriate prefix: `fix:` for US1–US3, `feat:` for US4
- The `npm test` command is broken (ABI mismatch with Node.js v25.8.1) — use `npx tree-sitter test` instead
- Version bump (T025) uses `feat:` commit prefix since it accompanies new named node types
