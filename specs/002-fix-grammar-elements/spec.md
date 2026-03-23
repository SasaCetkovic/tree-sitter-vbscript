# Feature Specification: Fix Missing VBScript Grammar Elements

**Feature Branch**: `002-fix-grammar-elements`
**Created**: 2026-03-22
**Status**: Draft
**Input**: User description: "Implement missing vbscript elements"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Fix Core Control Flow Parsing (Priority: P1)

As a grammar developer and tool author, I want block-level control flow constructs
(`If...End If`, `ElseIf`, `Else`, and `Option Explicit`) to parse correctly so that
any tool built on this grammar can accurately analyze VBScript programs that use
multi-line conditional logic.

Currently, `If x > 0 Then\n  y = 1\nEnd If` produces a `single_line_if_statement`
node instead of a `block_if_statement`, and `ElseIf` clauses produce ERROR nodes.
This means the parser cannot distinguish single-line from block conditionals,
making the parse tree unreliable for downstream tools.

**Why this priority**: Multi-line `If` statements are the most common control flow
construct in VBScript. Incorrect parsing affects the majority of real-world VBScript
files. `Option Explicit` is universally present in well-written VBScript as the
very first statement.

**Independent Test**: Can be fully tested by running `tree-sitter test` and verifying
that the skip-marked tests in `known_failures.txt` for `block_if_statement`,
`elseif_clause`, `else_clause`, and `option_explicit_statement` now pass and produce
correct S-expression trees with zero ERROR nodes.

**Acceptance Scenarios**:

1. **Given** a VBScript file with `If condition Then\n  body\nEnd If`, **When** parsed,
   **Then** the parser produces a `block_if_statement` node, not a `single_line_if_statement`.
2. **Given** a VBScript file with `If...ElseIf...Else...End If`, **When** parsed,
   **Then** the parser produces `block_if_statement` with `elseif_clause` and
   `else_clause` nodes — no ERROR nodes.
3. **Given** a VBScript file starting with `Option Explicit`, **When** parsed,
   **Then** the first node is `option_explicit_statement`, not `implicit_call_statement`.
4. **Given** a mixed-case variant `iF x THEN\n  y = 1\nEnd If`, **When** parsed,
   **Then** it produces the same `block_if_statement` tree as the lowercase equivalent.

---

### User Story 2 - Fix Keyword Literal Parsing (Priority: P2)

As a grammar developer, I want `True`, `False`, `Nothing`, `Empty`, and `Null` to
parse as their correct node types (`boolean_literal`, `nothing`, `empty`, `null`)
rather than as generic `identifier` nodes, so that tools can distinguish VBScript
keyword values from user-defined variable names.

Currently all five keywords are indistinguishable from identifiers like `myVar`,
which makes it impossible for syntax highlighters, linters, or static analyzers to
correctly identify boolean expressions or null checks.

**Why this priority**: Every VBScript program uses boolean values. Misclassifying
`True` and `False` as identifiers is a fundamental semantic error affecting all
boolean expressions and conditions.

**Independent Test**: Can be fully tested by running `tree-sitter test` and verifying
that the skip-marked tests in `known_failures.txt` for `boolean_literal` (True/False),
`nothing`, `empty`, and `null` now pass with their correct node types.

**Acceptance Scenarios**:

1. **Given** `x = True`, **When** parsed, **Then** the right operand is a
   `boolean_literal` node, not an `identifier`.
2. **Given** `x = False`, **When** parsed, **Then** the right operand is a
   `boolean_literal` node.
3. **Given** `Set obj = Nothing`, **When** parsed, **Then** the right side of the
   `set_statement` is a `nothing` node, not an `identifier`.
4. **Given** `x = Empty`, **When** parsed, **Then** the right operand is an
   `empty` node.
5. **Given** `x = Null`, **When** parsed, **Then** the right operand is a `null` node.

---

### User Story 3 - Fix Assignment Expression Parsing (Priority: P3)

As a grammar developer and tool author, I want `x = 5` (plain assignment without
the optional `Let` keyword) to parse as an `assignment_expression` node, so that
tools can correctly distinguish assignments from equality comparisons.

Currently, `x = expr` always produces a `binary_expression` (comparison `=`), so
tools cannot identify when a variable is being assigned a value unless the optional
`Let` keyword is explicitly used. The VBScript Language Reference states that `Let`
is optional and assignment without it is equally common and valid.

**Why this priority**: Assignment is the most fundamental operation in any program.
Misclassifying assignments as comparisons makes the parse tree semantically incorrect
for the vast majority of VBScript statements.

**Independent Test**: Can be fully tested by running `tree-sitter test` and verifying
that `x = 5` (without `Let`) produces `assignment_expression` in statement position,
while `If x = 5 Then` correctly retains `=` as a comparison `binary_expression`.

**Acceptance Scenarios**:

1. **Given** `x = 5` as a standalone statement, **When** parsed, **Then** the parser
   produces `expression_statement(assignment_expression(identifier, number_literal))`.
2. **Given** `x = expr` and `Let x = expr`, **When** both parsed, **Then** both
   produce `assignment_expression` with identical tree structure.
3. **Given** `If x = 5 Then y = 1`, **When** parsed, **Then** the `x = 5` condition
   remains a `binary_expression` (comparison), and `y = 1` in the consequence is an
   `assignment_expression`.
4. **Given** `obj.prop = value` as a standalone statement, **When** parsed, **Then**
   the parser produces `assignment_expression` with a `member_expression` as the
   left-hand side and `value` as the right-hand side — no more incorrect wrapping of
   `obj` and the property into a `binary_expression`.
5. **Given** `arr(i) = value` as a standalone statement, **When** parsed, **Then**
   the parser produces `assignment_expression` with a `call_expression` (subscript)
   as the left-hand side.

---

### User Story 4 - Add Missing Literal Types (Priority: P4)

As a grammar developer, I want hex literals (`&HFF`), octal literals (`&O77`), and
date/time literals (`#1/1/2000#`) to be recognized as distinct literal node types
so that VBScript programs using numeric hex constants or date values parse without
ERROR nodes.

Hex literals appear in virtually all production VBScript that interacts with COM
objects (e.g., `&H80000000` for HRESULT error codes). Date literals are common in
any database-driven or date-handling VBScript code.

**Why this priority**: While less fundamental than control flow and assignment, hex
literals appear in nearly all COM/ActiveX VBScript. These constructs currently
produce ERROR nodes, meaning any such file is unparseable.

**Independent Test**: Can be fully tested by running `tree-sitter test` and verifying
that `x = &HFF`, `x = &O77`, and `x = #1/1/2000#` each produce a specific literal
node type with zero ERROR nodes.

**Acceptance Scenarios**:

1. **Given** `x = &HFF`, **When** parsed, **Then** it produces a `hex_literal` node
   — no ERROR node.
2. **Given** `x = &H80000000`, **When** parsed, **Then** it produces a `hex_literal`
   node regardless of case (`&hff` and `&HFF` are equivalent).
3. **Given** `x = &O77`, **When** parsed, **Then** it produces an `octal_literal`
   node — no ERROR node.
4. **Given** `x = #1/1/2000#`, **When** parsed, **Then** it produces a `date_literal`
   node — no ERROR node.
5. **Given** `x = #12/31/1999 11:59:59 PM#`, **When** parsed, **Then** it produces
   a `date_literal` node (date with time component).

---

### Edge Cases

- How does the parser handle deeply nested `If...ElseIf...ElseIf...Else...End If` chains?
- What happens when `True` or `False` appear as property names on objects
  (e.g., `obj.True` — should `True` still be `boolean_literal` in member expression)?
- Does hex literal `&Hff` (lowercase h) parse the same as `&HFF` (uppercase H)?
- How does a date literal interact with division: is `x = #1/1/2000#` unambiguous?
- Assignment to member expressions (`obj.prop = value`) is in scope and must produce
  `assignment_expression` with a `member_expression` left-hand side.
- Assignment in `For` loop: `For i = 1 To 10` — the `=` here must remain part of
  `for_statement` syntax and NOT become an `assignment_expression`.
- What happens with `Set obj = Nothing` after fixing the `nothing` literal — does
  `set_statement` need updating?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The grammar MUST parse `If condition Then\n...\nEnd If` as a
  `block_if_statement` node when the `Then` keyword is immediately followed by a
  newline.
- **FR-002**: The grammar MUST parse `ElseIf condition Then\n...\n` within a block
  `If` statement as an `elseif_clause` node with zero ERROR nodes.
- **FR-003**: The grammar MUST parse `Else\n...\n` within a block `If` statement
  as an `else_clause` node.
- **FR-004**: The grammar MUST parse `Option Explicit` followed by a newline as an
  `option_explicit_statement` node.
- **FR-005**: The grammar MUST parse `True` and `False` as `boolean_literal` nodes
  in all expression contexts.
- **FR-006**: The grammar MUST parse `Nothing` as a `nothing` node in all expression
  and `set_statement` contexts.
- **FR-007**: The grammar MUST parse `Empty` as an `empty` node in all expression
  contexts.
- **FR-008**: The grammar MUST parse `Null` as a `null` node in all expression
  contexts.
- **FR-009**: The grammar MUST parse `lvalue = expression` in a statement position as
  an `assignment_expression` for all valid left-hand side forms: plain identifier
  (`x = expr`), member expression (`obj.prop = expr`), and subscript/call expression
  (`arr(i) = expr`).
- **FR-009a**: The member expression parsing bug MUST also be fixed: `x = obj.Name`
  currently produces `member_expression(binary_expression(x, obj), Name)` — after the
  fix it MUST produce `assignment_expression(identifier, member_expression(obj, Name))`.
- **FR-010**: The grammar MUST continue to parse `=` as a comparison `binary_expression`
  when used inside a condition (e.g., `If x = 5 Then`) — assignment fix must not
  break comparisons.
- **FR-011**: The grammar MUST parse hex literals of the form `&H[0-9A-Fa-f]+`
  (case-insensitive prefix) as a `hex_literal` node type without ERROR nodes.
- **FR-012**: The grammar MUST parse octal literals of the form `&O[0-7]+`
  (case-insensitive prefix) as an `octal_literal` node type without ERROR nodes.
- **FR-013**: The grammar MUST parse date/time literals of the form `#...#` as a
  `date_literal` node without ERROR nodes, supporting at minimum the `MM/DD/YYYY`
  and `MM/DD/YYYY HH:MM:SS AM/PM` formats from the VBScript Language Reference.
- **FR-014**: All 132 previously passing corpus tests MUST continue to pass after
  these grammar changes — zero regressions.
- **FR-015**: The `:skip`-marked tests in `known_failures.txt` that relate to fixed
  constructs MUST be promoted to passing tests in appropriate main corpus files.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All grammar-bug skip-marked tests (block_if, elseif_clause, else_clause,
  option_explicit_statement, boolean_literal, nothing, empty, null, assignment_expression)
  pass without `:skip` — 9 fewer skipped tests.
- **SC-001a**: The member expression assignment bug (`x = obj.Name` producing wrong tree)
  has at least one passing corpus test demonstrating the correct parse.
- **SC-002**: At least 6 new passing corpus tests cover the 3 added literal types
  (hex, octal, date) — 2+ tests per type.
- **SC-003**: All 132 previously passing corpus tests continue to pass — zero
  regressions confirmed by a full `tree-sitter test` run.
- **SC-004**: `tree-sitter test` reports 100% pass rate across all non-skipped tests
  after all changes are applied.
- **SC-005**: The total number of declared GLR conflict pairs in the grammar does not
  increase beyond the current 8 without documented justification in a code comment.

## Assumptions

- The root cause of the control flow parsing bug is the `/[\s\t]/` pattern in the
  grammar extras array: JavaScript's `\s` matches newline characters, causing line
  terminators to be consumed as whitespace rather than as `$._terminator` tokens.
  Changing extras to `/[ \t]/` (space and tab only) is the expected fix.
- The root cause of the keyword literal parsing bug is the absence of a `word`
  property in the grammar. Adding `word: $ => $.identifier` enables tree-sitter's
  keyword extraction to differentiate reserved words from identifiers.
- The assignment parsing fix requires GLR conflict resolution adjustments. The
  VBScript Language Reference explicitly states that `Let` is optional for
  assignment (section: Assignment Statements).
- Hex literal prefix `&H` is case-insensitive per VBScript spec (`&h` and `&H`
  are both valid).
- Octal literal prefix `&O` is case-insensitive per VBScript spec.
- Date literals use `#` as delimiter; the content format follows standard VBScript
  date string rules. The grammar need not validate the date value itself — only
  tokenize the `#...#` construct.
- All 6 language bindings must continue to compile after grammar regeneration.
- The pre-existing `npm test` ABI mismatch (tree-sitter@0.22.4 vs Node.js v25.8.1)
  is out of scope for this feature.

## Clarifications

### Session 2026-03-22

- Q: Should hex (&HFF) and octal (&O77) produce separate named node types or unify under number_literal? → A: Separate named types — `hex_literal` and `octal_literal` — so tools can structurally distinguish numeric bases.
- Q: Should assignment expression fix cover only plain identifier lvalues or all lvalue types (member, subscript)? → A: All lvalue types, including fixing the member expression bug where `x = obj.Name` produces an incorrect tree.
- Q: What is the exact scope of "missing vbscript elements"? → A: The scope covers
  all constructs in `test/corpus/known_failures.txt` (grammar bugs: block_if,
  elseif_clause, else_clause, option_explicit_statement, boolean_literal, nothing,
  empty, null, assignment_expression) plus 3 missing literal types (hex, octal,
  date). Each is traceable to the Microsoft VBScript Language Reference.
