# Tasks: Corpus Test Suite

**Input**: Design documents from `/specs/001-corpus-test-suite/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md

**Tests**: Not applicable — this feature IS the test suite. Validation
tasks verify corpus tests pass via `tree-sitter test`.

**Organization**: Tasks are grouped by user story. Each corpus file
targets a specific grammar rule category. All corpus files within a
phase are parallelizable (different files, no dependencies).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- All corpus test files go in `test/corpus/` at repository root
- Reference `grammar.js` for rule definitions and field names
- Reference `specs/001-corpus-test-suite/data-model.md` for rule-to-file mapping
- Reference `specs/001-corpus-test-suite/quickstart.md` for test format examples
- Test inputs derived from Microsoft VBScript Language Reference

---

## Phase 1: Setup

**Purpose**: Create the test directory structure

- [X] T001 Create `test/corpus/` directory at repository root

**Checkpoint**: Directory exists and `tree-sitter test` runs (reports no tests found)

---

## Phase 2: User Story 1 - Validate Core Statements (Priority: P1) MVP

**Goal**: Corpus tests covering all VBScript statement types (21 rules
across 6 files). This is the MVP — once complete, the project has
foundational test coverage for all statement grammar rules.

**Independent Test**: Run `tree-sitter test` — all statement tests pass
with zero ERROR nodes.

### Implementation for User Story 1

- [X] T002 [P] [US1] Write corpus tests for declarations in test/corpus/declarations.txt covering: option_explicit_statement, variable_declaration (Dim, ReDim, ReDim Preserve), declared_variable (with dimensions), constant_declaration, constant_definition, set_statement. Include tests for access modifiers (Public/Private), multiple declarations on one line, and array dimensions. Fields to verify: keyword, name, access_modifier, dimensions, value, left, right. Minimum 8 test cases.

- [X] T003 [P] [US1] Write corpus tests for control flow in test/corpus/control_flow.txt covering: block_if_statement, single_line_if_statement, elseif_clause, else_clause, select_case_statement, case_clause, case_else_clause, case_expression_list, range_expression (alias), is_expression (alias). Include tests for nested if/elseif chains, single-line if with else, Select Case with range expressions (1 To 10), Is expressions (Is > 5), multiple case values, and colon-separated statement_group. Fields to verify: condition, consequence, alternative, value, operator. Minimum 10 test cases.

- [X] T004 [P] [US1] Write corpus tests for loops in test/corpus/loops.txt covering: for_statement, for_each_statement, do_loop_statement (all 5 forms: Do...Loop, Do While...Loop, Do Until...Loop, Do...Loop While, Do...Loop Until), while_wend_statement. Include tests for For with Step, nested loops, and empty loop bodies. Fields to verify: counter, start, end, step, element, group, loop_type, condition. Minimum 8 test cases.

- [X] T005 [P] [US1] Write corpus tests for procedures in test/corpus/procedures.txt covering: function_declaration, sub_declaration, parameter_list, parameter (with Optional, ByVal, ByRef, array params), call_statement, implicit_call_statement, exit_statement (all 5 variants: Exit Do, Exit For, Exit Function, Exit Sub, Exit Property), expression_statement, line_label, statement_group (colon-separated). Include tests for access modifiers on procedures, empty parameter lists, multiple parameters, and labeled lines. Fields to verify: access_modifier, name, parameters, optional, mechanism, is_array, function, arguments, label. Minimum 10 test cases.

- [X] T006 [P] [US1] Write corpus tests for error handling in test/corpus/error_handling.txt covering: on_error_statement (both On Error Resume Next and On Error GoTo label), goto_statement, erase_statement (single and multiple arrays). Fields to verify: label. Minimum 4 test cases.

- [X] T007 [P] [US1] Write corpus tests for With statement in test/corpus/with_statement.txt covering: with_statement, unqualified_member_expression (`.property` syntax inside With blocks). Include tests for nested With blocks, method calls on unqualified members, and assignment to unqualified members. Fields to verify: object, property. Minimum 4 test cases.

- [X] T008 [US1] Run `tree-sitter test` and verify all US1 corpus tests pass with zero failures and zero ERROR nodes in expected S-expressions

**Checkpoint**: All 6 statement corpus files pass. Statement coverage is complete and independently verifiable.

---

## Phase 3: User Story 2 - Validate Expressions and Operators (Priority: P2)

**Goal**: Corpus tests for all expression types and all 16 operator
precedence levels.

**Independent Test**: Run `tree-sitter test` on expressions corpus file
and verify operator nesting matches VBScript precedence.

### Implementation for User Story 2

- [X] T009 [US2] Write corpus tests for expressions in test/corpus/expressions.txt covering: assignment_expression (with optional Let keyword), binary_expression (all operators: +, -, *, /, \, Mod, ^, &, =, <>, <, <=, >, >=, And, Or, Xor, Eqv, Imp, Is), unary_expression (+, -, Not), parenthesized_expression, member_expression (object.property chains), call_expression (with arguments), argument_list. Include tests for: precedence verification (a + b * c nests multiplication inside addition), left-associativity (a - b - c), all 16 precedence levels in one expression, mixed case operators (aNd, oR), nested function calls a(b(c(d))), member chains a.b.c.d. Fields to verify: left, right, operator, operand, function, arguments, object, property. Minimum 12 test cases.

- [X] T010 [US2] Run `tree-sitter test` and verify all US2 expression tests pass with correct precedence nesting

**Checkpoint**: Expression and operator coverage complete. Precedence verified.

---

## Phase 4: User Story 3 - Validate Terminals and Literals (Priority: P3)

**Goal**: Corpus tests for all terminal/leaf node types and tokenization
edge cases.

**Independent Test**: Run `tree-sitter test` on literals corpus file
and verify leaf node types.

### Implementation for User Story 3

- [X] T011 [US3] Write corpus tests for terminals and literals in test/corpus/literals.txt covering: identifier (simple, underscore-prefixed, mixed alphanumeric), string_literal (simple, empty "", escaped quotes "He said ""hi"""), number_literal (integer 42, decimal 3.14), boolean_literal (True, False), nothing, empty, null, comment (' style), rem_comment (REM style), line_continuation ( _ across lines). Include tests for: mixed-case keywords for at least 5 keywords (dIm, FuNcTiOn, sElEcT, tRuE, nOtHiNg), line continuation within expressions and parameter lists. Minimum 10 test cases.

- [X] T012 [US3] Run `tree-sitter test` and verify all US3 literal tests pass

**Checkpoint**: Terminal/literal coverage complete. Case-insensitivity verified for 5+ keywords.

---

## Phase 5: User Story 4 - Validate Class Constructs (Priority: P4)

**Goal**: Corpus tests for VBScript class definitions, properties, and
access modifiers.

**Independent Test**: Run `tree-sitter test` on classes corpus file and
verify class tree structure.

### Implementation for User Story 4

- [X] T013 [US4] Write corpus tests for classes in test/corpus/classes.txt covering: class_statement (with access modifiers, empty class), class_statement_group (colon-separated class members), property_get_statement (with Default keyword, with parameters), property_let_statement, property_set_statement, function_declaration and sub_declaration within classes, declaration_statement within classes. Include tests for: Public/Private access modifiers on all class members, Default Property Get, nested method declarations, class with multiple property types. Fields to verify: access_modifier, default, name, parameters. Minimum 6 test cases.

- [X] T014 [US4] Run `tree-sitter test` and verify all US4 class tests pass

**Checkpoint**: Class construct coverage complete. All property types and access modifiers verified.

---

## Phase 6: User Story 5 - Validate Grammar Conflict Zones (Priority: P5)

**Goal**: Regression tests for all 5 documented conflict pairs in
`grammar.js` lines 47-64.

**Independent Test**: Run `tree-sitter test` on conflicts corpus file
and verify each ambiguous input resolves correctly.

### Implementation for User Story 5

- [X] T015 [US5] Write corpus tests for conflict zones in test/corpus/conflicts.txt covering all 5 conflicts: (1) call_expression vs implicit_call_statement — test foo(bar) vs foo bar, baz; (2) _expression vs _lvalue — test x = 5 in assignment vs comparison context; (3) _primary_expression vs _lvalue — test identifier as expression vs assignment target; (4) parenthesized_expression vs argument_list — test ((foo)) as parenthesized expression vs single-item argument list; (5) unqualified_member_expression vs member_expression — test .bar inside With block vs obj.bar outside. Each conflict pair MUST have at least one test for each resolution path. Minimum 8 test cases.

- [X] T016 [US5] Run `tree-sitter test` and verify all US5 conflict tests pass with correct resolution for each ambiguity

**Checkpoint**: All 5 conflict zones regression-tested. Ambiguity resolutions verified.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Negative tests, known failures, and final validation

- [X] T017 [P] Write negative tests in test/corpus/invalid_syntax.txt with `:error` attribute for 10-15 invalid VBScript patterns including: unclosed Function/Sub/Class/If/For/While blocks, reserved keyword used as identifier, missing Then after If condition, invalid operator combinations, malformed Select Case (missing Case keyword), empty Dim without variable name, invalid parameter syntax, duplicate Option Explicit. Each test uses the `:error` attribute to assert ERROR node presence.

- [X] T018 [P] Write known failure tests in test/corpus/known_failures.txt with `:skip` attribute for valid VBScript syntax that the current grammar cannot parse. Research Microsoft VBScript Language Reference for constructs not yet in grammar.js. Each test must include a comment identifying the VBScript specification section. Examples to investigate: Execute statement, Randomize, date/time literals (#1/1/2000#), hex literals (&HFF), octal literals (&O77), TypeName, IsArray/IsDate/IsEmpty/IsNull/IsNumeric/IsObject built-in functions as special forms.

- [X] T019 Run full `tree-sitter test` to verify all non-skipped corpus tests pass, then run `npm test` to verify Node.js binding still works

- [X] T020 Verify all success criteria: SC-001 (100% pass rate), SC-002 (every named rule in at least one test), SC-003 (all 5 conflicts tested), SC-004 (>= 50 test cases total), SC-005 (no ERROR nodes in passing tests), SC-006 (>= 5 mixed-case keyword tests)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — creates directory
- **US1-US5 (Phases 2-6)**: Depend on Setup only. All user stories write to different files and CAN proceed in parallel
- **Polish (Phase 7)**: Depends on Phases 2-6 completion for final validation

### User Story Dependencies

- **US1 (P1)**: After Setup — no dependencies on other stories
- **US2 (P2)**: After Setup — no dependencies on other stories
- **US3 (P3)**: After Setup — no dependencies on other stories
- **US4 (P4)**: After Setup — no dependencies on other stories
- **US5 (P5)**: After Setup — no dependencies on other stories

All stories are fully independent and write to different files.

### Within Each User Story

- Write corpus file(s) first
- Run `tree-sitter test` to verify
- Fix any test failures before marking complete

### Parallel Opportunities

- T002-T007 all write to different files — fully parallel
- T009, T011, T013, T015 write to different files — can parallel across stories
- T017-T018 write to different files — fully parallel

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: US1 - Core Statements (T002-T008)
3. **STOP and VALIDATE**: Run `tree-sitter test` — all 44+ tests pass
4. This alone covers 30+ grammar rules across 6 files

### Incremental Delivery

1. Setup → US1 (statements) → Validate (MVP!)
2. Add US2 (expressions) → Validate
3. Add US3 (literals) → Validate
4. Add US4 (classes) → Validate
5. Add US5 (conflicts) → Validate
6. Polish (negative tests, known failures, final verification)

### Parallel Execution

With multiple agents/developers:

1. Complete Setup (T001)
2. Launch all story phases in parallel:
   - Agent A: US1 (T002-T007) — 6 corpus files
   - Agent B: US2 (T009) + US3 (T011) — 2 corpus files
   - Agent C: US4 (T013) + US5 (T015) — 2 corpus files
3. Each agent validates independently
4. Final validation (T019-T020) after all complete

---

## Notes

- All tasks write `.txt` files — no code changes to `grammar.js` or bindings
- Test inputs MUST come from Microsoft VBScript Language Reference, not from grammar behavior
- Use `specs/001-corpus-test-suite/quickstart.md` for test format reference
- Use `specs/001-corpus-test-suite/data-model.md` for rule-to-file mapping
- Commit after each completed user story phase with `test:` prefix
