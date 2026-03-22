# Research: Corpus Test Suite

**Feature**: 001-corpus-test-suite
**Date**: 2026-03-22

## R1: Tree-sitter Corpus Test Format

**Decision**: Use standard tree-sitter test format with attributes.

**Rationale**: The tree-sitter documentation defines a specific test format
that `tree-sitter test` expects. Using this format ensures compatibility
with the built-in test runner.

**Format specification**:

```text
==================
Test Name Here
==================

<source code input>

---

(expected_s_expression)
```

- Test name is enclosed by lines of `=` characters (3+ equals signs)
- Source code follows the header
- A line of `-` characters (3+ dashes) separates input from expected output
- Expected output is an S-expression showing named nodes and fields
- Anonymous nodes (keywords, punctuation) are omitted from S-expressions
- Field names appear as prefixes: `field_name: (node_type)`

**Available attributes** (placed in header below test name):
- `:skip` — Test is not executed (used for `known_failures.txt`)
- `:error` — Asserts the parse tree contains an ERROR node (used for
  `invalid_syntax.txt`)
- `:fail-fast` — Stops test execution if this test fails

**Alternatives considered**:
- Custom test harness: Rejected. tree-sitter's built-in format is
  well-documented and requires no additional tooling.

## R2: Microsoft VBScript Language Reference

**Decision**: Use the Microsoft VBScript Language Reference as the
authoritative source for all test inputs.

**Rationale**: The project constitution (Principle I) mandates VBScript
Specification Fidelity. Test inputs must represent valid VBScript as
defined by Microsoft, not as inferred from the current grammar behavior.

**Key reference areas for test inputs**:
- Statements: Dim, ReDim, Const, Set, If...Then...Else, Select Case,
  For...Next, For Each...Next, Do...Loop, While...Wend, With, Call,
  Sub, Function, Class, Property, On Error, GoTo, Erase, Exit, REM
- Operators: Arithmetic (+, -, *, /, \, Mod, ^), Comparison (=, <>,
  <, >, <=, >=), Concatenation (&), Logical (And, Or, Xor, Not, Eqv,
  Imp), Object (Is)
- Literals: String ("text", "" escape), Numeric (integer, float),
  Boolean (True, False), Special (Nothing, Empty, Null)
- Option Explicit directive

**Alternatives considered**:
- Using the current grammar as source of truth: Rejected per user
  direction. The grammar is known to be incomplete and not necessarily
  correct.

## R3: Known Failures Strategy

**Decision**: Use `:skip` attribute in `test/corpus/known_failures.txt`.

**Rationale**: tree-sitter's `:skip` attribute prevents a test from
executing while keeping it visible in the test file. This allows tracking
grammar gaps as executable test cases that can be "unskipped" once the
grammar is fixed.

**Implementation**:
```text
==============================
Feature not yet in grammar
:skip
==============================

<valid VBScript per spec>

------------------------------

(expected_s_expression)
```

**Alternatives considered**:
- Separate directory: Rejected. tree-sitter scans `test/corpus/` by
  convention; a separate directory would require custom test runner
  configuration.
- GitHub issues only: Rejected. Executable test cases provide better
  traceability and can be automatically verified when grammar is updated.

## R4: Negative Test Strategy

**Decision**: Use `:error` attribute in `test/corpus/invalid_syntax.txt`.

**Rationale**: tree-sitter's `:error` attribute asserts that the parse
tree contains an ERROR node. This validates the parser correctly rejects
invalid syntax without requiring a full S-expression in the expected
output.

**Implementation**:
```text
==============================
Invalid: keyword as identifier
:error
==============================

Dim If

------------------------------
```

**Alternatives considered**:
- Full S-expression with ERROR nodes: Rejected. The `:error` attribute
  is simpler and more maintainable for negative tests.

## R5: Grammar Rule Coverage Inventory

**Decision**: 57 named rules require corpus test coverage.

**Breakdown by corpus file**:

| File | Rules Covered | Count |
|------|--------------|-------|
| `control_flow.txt` | block_if_statement, single_line_if_statement, elseif_clause, else_clause, select_case_statement, case_clause, case_else_clause, case_expression_list | 8 |
| `loops.txt` | for_statement, for_each_statement, do_loop_statement, while_wend_statement | 4 |
| `declarations.txt` | declaration_statement, variable_declaration, declared_variable, constant_declaration, constant_definition, set_statement, option_explicit_statement | 7 |
| `procedures.txt` | function_declaration, sub_declaration, parameter_list, parameter, call_statement, implicit_call_statement, exit_statement, expression_statement | 8 |
| `error_handling.txt` | on_error_statement, goto_statement, erase_statement | 3 |
| `classes.txt` | class_statement, class_statement_group, property_get_statement, property_let_statement, property_set_statement | 5 |
| `expressions.txt` | assignment_expression, binary_expression, unary_expression, parenthesized_expression, member_expression, call_expression, argument_list | 7 |
| `literals.txt` | identifier, string_literal, number_literal, boolean_literal, nothing, empty, null, comment, rem_comment, line_continuation | 10 |
| `with_statement.txt` | with_statement, unqualified_member_expression | 2 |
| `conflicts.txt` | (regression tests for 5 conflict pairs) | 0 (cross-cutting) |
| Structural | source_file, statement_group, statement_line, line_label | 4 |

**Aliases requiring tests**: `range_expression`, `is_expression` (both
in `_case_expression`, tested via `control_flow.txt`).

**Total named rules**: 57 + 2 aliases = 59 nodes to cover.
**Structural rules** (source_file, statement_group, statement_line,
line_label) appear implicitly in every test but also get dedicated tests
for edge cases (empty file, colon-separated statements, labeled lines).
