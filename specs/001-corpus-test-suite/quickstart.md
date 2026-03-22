# Quickstart: Corpus Test Suite

**Feature**: 001-corpus-test-suite
**Date**: 2026-03-22

## Prerequisites

- Node.js installed
- tree-sitter-cli >= 0.25.7 (`npm install` in project root)

## Writing a Corpus Test

1. Create or edit a file in `test/corpus/` (e.g., `test/corpus/loops.txt`)

2. Add a test case using this format:

```text
==================
Simple for loop
==================

For i = 1 To 10
  x = x + i
Next

---

(source_file
  (statement_line
    (for_statement
      counter: (identifier)
      start: (number_literal)
      end: (number_literal)
      (statement_line
        (assignment_expression
          left: (identifier)
          right: (binary_expression
            left: (identifier)
            operator: (+)
            right: (identifier)))))))
```

3. The S-expression shows only named nodes. Keywords like `For`, `To`,
   `Next` are anonymous and omitted.

4. Field names appear as `field_name:` before the node.

## Running Tests

```bash
# Run all corpus tests
tree-sitter test

# Run tests filtering by name pattern
tree-sitter test --filter "for loop"

# Build + run Node.js binding test
npm test
```

## Test Attributes

Place attributes in the header below the test name:

```text
==================
Known grammar gap
:skip
==================
```

| Attribute | Purpose | Used In |
|-----------|---------|---------|
| `:skip` | Skip test execution | `known_failures.txt` |
| `:error` | Assert parse tree has ERROR node | `invalid_syntax.txt` |
| `:fail-fast` | Stop all tests if this one fails | Critical regression tests |

## File Organization

| File | What to test |
|------|-------------|
| `control_flow.txt` | If/ElseIf/Else, Select Case, single-line If |
| `loops.txt` | For, For Each, Do/Loop, While/Wend |
| `declarations.txt` | Dim, ReDim, Const, Set, Option Explicit |
| `procedures.txt` | Function, Sub, Call, implicit calls, Exit, labels |
| `error_handling.txt` | On Error, GoTo, Erase |
| `classes.txt` | Class, Property Get/Let/Set |
| `expressions.txt` | Binary, unary, assignment, member, call expressions |
| `literals.txt` | Strings, numbers, booleans, Nothing/Empty/Null, comments |
| `with_statement.txt` | With blocks, `.property` access |
| `conflicts.txt` | Conflict zone regression tests |
| `invalid_syntax.txt` | Negative tests (`:error` attribute) |
| `known_failures.txt` | Valid VBScript grammar can't parse (`:skip` attribute) |

## Common Patterns

### Testing case-insensitivity

Use mixed-case keywords to verify `ci()` helper works:

```text
==================
Case insensitive Dim
==================

dIm myVar

---

(source_file
  (statement_line
    (variable_declaration
      keyword: (identifier)
      (declared_variable
        name: (identifier)))))
```

### Testing field presence

Verify field names appear in S-expression output:

```text
==================
For loop with step
==================

For i = 1 To 10 Step 2
Next

---

(source_file
  (statement_line
    (for_statement
      counter: (identifier)
      start: (number_literal)
      end: (number_literal)
      step: (number_literal))))
```

### Negative test (invalid syntax)

```text
==================
Invalid: unclosed function
:error
==================

Function Foo()

---
```

## Verification Checklist

After adding tests:

1. Run `tree-sitter test` — all non-skipped tests must pass
2. Run `npm test` — binding test must still pass
3. Verify no ERROR nodes in passing tests for valid VBScript
4. Confirm each new grammar rule has at least one test
