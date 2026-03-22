# Feature Specification: Corpus Test Suite

**Feature Branch**: `001-corpus-test-suite`
**Created**: 2026-03-22
**Status**: Draft
**Input**: User description: "Add comprehensive tree-sitter corpus test suite covering all VBScript grammar rules"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Validate Core Statements (Priority: P1)

As a grammar developer, I want corpus tests covering all VBScript statement
types so that I can verify the parse tree structure is correct after any
grammar change. This covers the 21 statement types defined in the grammar:
`with_statement`, `on_error_statement`, `block_if_statement`,
`single_line_if_statement`, `select_case_statement`, `for_statement`,
`for_each_statement`, `do_loop_statement`, `while_wend_statement`,
`exit_statement`, `erase_statement`, `goto_statement`, `call_statement`,
`set_statement`, `function_declaration`, `sub_declaration`,
`class_statement`, `property_get_statement`, `property_let_statement`,
`property_set_statement`, `declaration_statement` (variable and constant),
`implicit_call_statement`, and `expression_statement`.

**Why this priority**: Statements are the backbone of the grammar. Without
statement-level tests, any grammar refactoring risks silent breakage of
the most commonly used constructs.

**Independent Test**: Can be fully tested by running `tree-sitter test` and
verifying all statement corpus tests produce expected S-expression trees
with zero ERROR nodes.

**Acceptance Scenarios**:

1. **Given** a corpus test file for each statement type, **When** running
   `tree-sitter test`, **Then** all tests pass and produce the expected
   parse tree structure.
2. **Given** a VBScript statement with mixed-case keywords (e.g., `DiM`,
   `fUnCtIoN`), **When** parsed, **Then** the parser produces the same
   tree structure as the lowercase equivalent.
3. **Given** multiple statements on one line separated by colons, **When**
   parsed, **Then** each statement appears as a separate node within a
   `statement_group`.

---

### User Story 2 - Validate Expressions and Operators (Priority: P2)

As a grammar developer, I want corpus tests for all expression types and
operators so that precedence and associativity are verified. This covers
all 16 precedence levels with their operators: `=`, `<>`, `<`, `<=`, `>`,
`>=`, `Is`, `&`, `+`, `-`, `*`, `/`, `\`, `Mod`, `^`, `And`, `Or`, `Xor`,
`Not`, `Eqv`, `Imp`, along with parenthesized expressions, member
expressions, unqualified member expressions, call expressions, and
assignment expressions.

**Why this priority**: Operator precedence is the second most common source
of grammar bugs (after conflict resolution). Incorrect precedence silently
produces wrong parse trees.

**Independent Test**: Can be fully tested by running `tree-sitter test` on
expression corpus files and verifying operator nesting matches VBScript
precedence rules.

**Acceptance Scenarios**:

1. **Given** a binary expression `a + b * c`, **When** parsed, **Then** `*`
   binds tighter than `+` (multiplication is nested inside addition).
2. **Given** an expression combining all 16 precedence levels, **When**
   parsed, **Then** the tree nesting order matches VBScript specification.
3. **Given** a chain of left-associative operators `a - b - c`, **When**
   parsed, **Then** the leftmost operation is nested deepest.
4. **Given** a unary expression `-Not x`, **When** parsed, **Then** `Not`
   binds tighter than unary `-` (unary precedence vs. not precedence).

---

### User Story 3 - Validate Terminals and Literals (Priority: P3)

As a grammar developer, I want corpus tests for all terminal nodes
(identifiers, string literals, number literals, boolean literals,
`Nothing`, `Empty`, `Null`, comments, `REM` comments, and line
continuations) so that tokenization edge cases are covered.

**Why this priority**: Terminals are the leaf nodes of every parse tree.
While less likely to break from grammar restructuring, edge cases like
escaped quotes in strings (`""`) and line continuations (` _`) are
fragile.

**Independent Test**: Can be fully tested by running `tree-sitter test` on
terminal corpus files and verifying leaf node content and types.

**Acceptance Scenarios**:

1. **Given** a string literal containing escaped quotes `"He said ""hi"""`,
   **When** parsed, **Then** it produces a single `string_literal` node.
2. **Given** a statement split across lines with ` _` continuation, **When**
   parsed, **Then** the parser treats it as one logical statement.
3. **Given** both `' comment` and `REM comment` syntax, **When** parsed,
   **Then** `'` produces a `comment` node and `REM` produces a
   `rem_comment` node.
4. **Given** number literals `42` and `3.14`, **When** parsed, **Then** both
   produce `number_literal` nodes.

---

### User Story 4 - Validate Class Constructs (Priority: P4)

As a grammar developer, I want corpus tests for VBScript class definitions
including `Property Get`, `Property Let`, `Property Set`, access modifiers,
and nested declarations so that class-related grammar rules are verified.

**Why this priority**: Class constructs are complex (nested statement
groups, access modifiers, multiple property types) and have their own
supertype (`_class_statement`). They warrant dedicated testing.

**Independent Test**: Can be fully tested by running `tree-sitter test` on
class corpus files and verifying class tree structure.

**Acceptance Scenarios**:

1. **Given** a class with `Property Get`, `Property Let`, and
   `Property Set`, **When** parsed, **Then** each produces its
   corresponding node type with correct field names.
2. **Given** a class with `Public` and `Private` access modifiers on
   methods and properties, **When** parsed, **Then** the `access_modifier`
   field is correctly set.
3. **Given** a class with a `Default Property Get`, **When** parsed,
   **Then** the `default` field is present on the property node.

---

### User Story 5 - Validate Grammar Conflict Zones (Priority: P5)

As a grammar developer, I want corpus tests specifically targeting the 5
documented conflict zones so that conflict resolutions are regression-tested.
The conflicts are: (1) `call_expression` vs `implicit_call_statement`,
(2/3) `_expression`/`_primary_expression` vs `_lvalue`,
(4) `parenthesized_expression` vs `argument_list`, and
(5) `unqualified_member_expression` vs `member_expression`.

**Why this priority**: Conflicts are the grammar's known ambiguity points.
14 of 25 historical commits were conflict-related fixes. These tests
prevent regressions in the most fragile areas.

**Independent Test**: Can be fully tested by running `tree-sitter test` on
conflict corpus files and verifying each ambiguous input resolves to the
expected parse tree.

**Acceptance Scenarios**:

1. **Given** `foo(bar)` (parenthesized call), **When** parsed, **Then** it
   produces a `call_expression`, not an `implicit_call_statement`.
2. **Given** `foo bar, baz` (implicit call), **When** parsed, **Then** it
   produces an `implicit_call_statement` with an `argument_list`.
3. **Given** `x = 5` in expression context, **When** parsed, **Then** it
   resolves correctly as an assignment or comparison based on context.
4. **Given** `.bar` inside a `With` block, **When** parsed, **Then** it
   produces an `unqualified_member_expression`.

---

### Edge Cases

- Empty bodies: `Sub MySub() End Sub`, `Function F() End Function`,
  `Class C End Class`, `With obj End With`
- Deeply nested control flow: `If` inside `For` inside `While` inside
  `With`
- Maximum precedence complexity: expression using all 16 levels
- Line continuations within complex expressions and parameter lists
- Colon-separated multi-statement lines with labels
- `Option Explicit` at file start followed by statements
- `ReDim Preserve` with multiple dimensions
- `Select Case` with range expressions (`1 To 10`) and `Is` expressions
  (`Is > 5`)
- `Do...Loop While` vs `Do While...Loop` disambiguation
- `On Error Resume Next` vs `On Error GoTo label`
- `Exit Do`, `Exit For`, `Exit Function`, `Exit Sub`, `Exit Property`
- Nested function calls: `a(b(c(d)))`
- Member chain: `a.b.c.d`
- Mixed case keywords: `dIm`, `FuNcTiOn`, `sElEcT`

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The test suite MUST include 10-12 corpus test files organized
  by subcategory: `control_flow.txt`, `loops.txt`, `declarations.txt`,
  `procedures.txt`, `error_handling.txt`, `classes.txt`,
  `expressions.txt`, `literals.txt`, `with_statement.txt`,
  `conflicts.txt`, `invalid_syntax.txt`, and `known_failures.txt`.
- **FR-002**: Each corpus test file MUST use the standard tree-sitter test
  format: test name header, VBScript input, separator line of dashes
  (`---` or `===`), and expected S-expression parse tree.
- **FR-003**: Corpus test files MUST reside in `test/corpus/` directory.
- **FR-004**: Every named (non-hidden) grammar rule MUST be exercised by
  at least one corpus test.
- **FR-005**: All corpus tests in the main corpus files MUST pass when run
  with `tree-sitter test`. Known-failing tests (valid VBScript syntax that
  the grammar cannot yet parse) MUST be placed in a separate file
  (`test/corpus/known_failures.txt`) excluded from CI to avoid blocking
  the test gate.
- **FR-006**: All corpus tests MUST produce parse trees with zero ERROR
  nodes for well-formed VBScript input.
- **FR-007**: The test suite MUST include at least one test per conflict
  zone (5 conflicts documented in `grammar.js`).
- **FR-008**: The test suite MUST include tests verifying case-insensitive
  keyword parsing (mixed-case variants).
- **FR-009**: The test suite MUST include tests for all 5 `exit_statement`
  variants (`Exit Do`, `Exit For`, `Exit Function`, `Exit Sub`,
  `Exit Property`).
- **FR-010**: The test suite MUST include tests for all `do_loop_statement`
  forms: `Do...Loop`, `Do While...Loop`, `Do Until...Loop`,
  `Do...Loop While`, `Do...Loop Until`.
- **FR-011**: The test suite MUST include tests for operator precedence
  covering all 16 precedence levels.
- **FR-012**: The test suite MUST include tests for string literals with
  embedded escaped quotes (`""`).
- **FR-013**: Corpus test inputs MUST be derived from the Microsoft VBScript
  Language Reference, not from the current grammar behavior. The
  specification is the authoritative source for valid VBScript syntax.
- **FR-014**: When a corpus test reveals a parsing failure (ERROR node) for
  syntax that is valid per the VBScript specification, the test MUST be
  placed in `test/corpus/known_failures.txt` with a comment indicating
  the grammar bug. Each known-failure test MUST reference the relevant
  VBScript specification section. These tests serve as a backlog of
  grammar fixes to be addressed separately.
- **FR-015**: The test suite MUST include a dedicated
  `test/corpus/invalid_syntax.txt` file containing 10-15 negative tests
  for common invalid VBScript patterns. These tests MUST verify that the
  parser produces ERROR nodes for syntax that is invalid per the VBScript
  specification. Examples include reserved keyword misuse, malformed
  declarations, and unclosed blocks.

### Key Entities

- **Corpus Test File**: A `.txt` file in `test/corpus/` following
  tree-sitter test format. Contains one or more named test cases, each
  with VBScript input and expected S-expression output.
- **Grammar Rule**: A named production in `grammar.js` that produces a
  node type in the parse tree. There are 57 named rules plus 2 aliases
  (range_expression, is_expression) in the current grammar.
- **Conflict Zone**: A pair of grammar rules listed in the `conflicts`
  array that create parser ambiguity. There are currently 5 conflict
  pairs.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `tree-sitter test` passes with 100% of corpus tests
  succeeding (zero failures).
- **SC-002**: Every named grammar rule (non-hidden, non-alias) appears in
  at least one corpus test S-expression output.
- **SC-003**: All 5 documented conflict zones have at least one dedicated
  regression test each.
- **SC-004**: The test suite includes at least 50 individual test cases
  across all corpus files.
- **SC-005**: No corpus test produces an ERROR node in its expected
  S-expression output for well-formed VBScript input.
- **SC-006**: Case-insensitive keyword tests cover at least 5 different
  keywords in mixed-case variants.

## Clarifications

### Session 2026-03-22

- Q: How should grammar bugs be handled in the test suite when the VBScript spec defines valid syntax the grammar can't yet parse? → A: Separate known-failing tests into `test/corpus/known_failures.txt` excluded from CI. Main corpus files must all pass.
- Q: Should the test suite include negative tests for invalid VBScript syntax? → A: Yes, include 10-15 negative tests in a dedicated `test/corpus/invalid_syntax.txt` file targeting common invalid patterns.
- Q: How should corpus test files be organized? → A: Medium granularity with 10-12 files grouping related grammar rules by subcategory (control_flow, loops, declarations, procedures, etc.).

## Assumptions

- The Microsoft VBScript Language Reference is the authoritative source for
  what constitutes valid VBScript syntax. Corpus tests MUST be written
  against the specification, not against the current grammar behavior. If a
  test reveals a discrepancy between the grammar and the specification, the
  grammar is considered incorrect and should be fixed separately.
- Corpus test files follow medium-granularity organization in
  `test/corpus/<category>.txt` with 10-12 files grouping related grammar
  rules:
  - `control_flow.txt` — if/elseif/else, select/case, single-line if
  - `loops.txt` — for, for each, do/loop, while/wend
  - `declarations.txt` — dim, redim, const, set, option explicit
  - `procedures.txt` — function, sub, call, implicit call, exit
  - `error_handling.txt` — on error, goto, erase
  - `classes.txt` — class, property get/let/set, access modifiers
  - `expressions.txt` — binary, unary, assignment, member, parenthesized
  - `literals.txt` — strings, numbers, booleans, nothing, empty, null,
    identifiers, comments, line continuations
  - `with_statement.txt` — with blocks and unqualified member expressions
  - `conflicts.txt` — tests targeting the 5 documented conflict zones
  - `invalid_syntax.txt` — 10-15 negative tests for invalid VBScript
  - `known_failures.txt` — valid VBScript the grammar cannot yet parse
- The `tree-sitter test` command is available via the `tree-sitter-cli`
  dev dependency (>= 0.25.7).
- S-expression output in test files uses the tree-sitter default format
  with named nodes and fields.
