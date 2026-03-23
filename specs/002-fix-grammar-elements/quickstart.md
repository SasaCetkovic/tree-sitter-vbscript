# Quickstart: Verifying Grammar Fixes

**Feature**: `002-fix-grammar-elements`
**Phase**: 1 — Design
**Date**: 2026-03-22

This guide shows how to verify each grammar fix after implementation.

---

## Prerequisites

```sh
# Must be on the feature branch
git checkout 002-fix-grammar-elements

# tree-sitter-cli required
npx tree-sitter --version  # must be >= 0.25.7
```

---

## Step 1: Regenerate the Parser

After every change to `grammar.js`, regenerate:

```sh
cd /Users/sasa/Projects/GitHub/tree-sitter-vbscript
npx tree-sitter generate
```

Expected: no errors, `src/parser.c` updated.

---

## Step 2: Run All Corpus Tests

```sh
npx tree-sitter test
```

Expected: All non-skipped tests pass. Zero ERROR nodes in passing tests.

To run only a specific file:
```sh
npx tree-sitter test --file-name "known_failures.txt"
npx tree-sitter test --file-name "literals.txt"
```

---

## Fix 1: Extras Fix — Block Constructs

**Verify with**:
```sh
printf 'If x > 0 Then\n  y = 1\nEnd If\n' | npx tree-sitter parse --stdin
```

**Expected output** (after fix):
```
(source_file
  (statement_line
    (statement_group
      (block_if_statement
        (binary_expression ...)
        (statement_line ...)))))
```

**Before fix** (wrong):
```
(source_file
  (statement_line (statement_group (single_line_if_statement ...)))
  (statement_line ...)
  ...)
```

**Option Explicit verify**:
```sh
printf 'Option Explicit\n' | npx tree-sitter parse --stdin
```

Expected: `(source_file (option_explicit_statement))`

---

## Fix 2: Keyword Literals — `word` Property

**Verify True/False**:
```sh
printf "x = True\n" | npx tree-sitter parse --stdin
```

Expected:
```
(source_file
  (statement_line
    (statement_group
      (expression_statement
        (assignment_expression
          (identifier)
          (boolean_literal))))))
```

Note: After BOTH fix 2 (`word` property) and fix 3 (assignment), `x = True` shows
`assignment_expression` containing `boolean_literal`. If only fix 2 is applied, it
will still show `binary_expression` with `boolean_literal`.

**Verify Nothing**:
```sh
printf "Set obj = Nothing\n" | npx tree-sitter parse --stdin
```

Expected: `set_statement` with `(nothing)` node (not `(identifier)`).

---

## Fix 3: Assignment Expression

**Verify plain assignment**:
```sh
printf "x = 5\n" | npx tree-sitter parse --stdin
```

Expected:
```
(source_file
  (statement_line
    (statement_group
      (expression_statement
        (assignment_expression
          (identifier)
          (number_literal))))))
```

**Verify comparison NOT broken**:
```sh
printf "If x = 5 Then y = 1\n" | npx tree-sitter parse --stdin
```

Expected: `single_line_if_statement` where condition is `binary_expression` (not
`assignment_expression`), and consequence body contains `assignment_expression`.

**Verify member expression assignment (FR-009a)**:
```sh
printf "x = obj.Name\n" | npx tree-sitter parse --stdin
```

Expected:
```
(expression_statement
  (assignment_expression
    (identifier)              ; x
    (member_expression        ; obj.Name
      (identifier)
      (identifier))))
```

Wrong (before fix):
```
(expression_statement
  (member_expression
    (binary_expression (identifier) (identifier))  ; x = obj (WRONG)
    (identifier)))
```

**Verify For loop = not affected**:
```sh
printf "For i = 1 To 10\nNext\n" | npx tree-sitter parse --stdin
```

Expected: `for_statement` (the `=` is part of for syntax, NOT assignment_expression).

---

## Fix 4: New Literal Types

**Verify hex literal**:
```sh
printf "x = &HFF\n" | npx tree-sitter parse --stdin
```

Expected:
```
(expression_statement
  (assignment_expression
    (identifier)
    (hex_literal)))
```

**Verify hex lowercase**:
```sh
printf "x = &hff\n" | npx tree-sitter parse --stdin
```

Expected: same tree (case-insensitive).

**Verify octal literal**:
```sh
printf "x = &O77\n" | npx tree-sitter parse --stdin
```

Expected:
```
(expression_statement
  (assignment_expression
    (identifier)
    (octal_literal)))
```

**Verify date literal**:
```sh
printf "x = #1/1/2000#\n" | npx tree-sitter parse --stdin
```

Expected:
```
(expression_statement
  (assignment_expression
    (identifier)
    (date_literal)))
```

**Verify date with time**:
```sh
printf "x = #12/31/1999 11:59:59 PM#\n" | npx tree-sitter parse --stdin
```

Expected: `date_literal` node (no ERROR).

---

## Final Validation

```sh
npx tree-sitter test
```

**Acceptance criteria**:
- All previously passing 132 tests still pass (zero regressions)
- 12 previously skipped tests now pass (promoted from `known_failures.txt`)
- Additional new tests for hex/octal/date pass
- `known_failures.txt` has no `:skip` tests remaining (or is empty)
- `tree-sitter test` exit code 0
- No ERROR nodes in any passing test's expected S-expression

---

## Conflict Count Verification

After implementation, verify conflict count decreased:

```sh
# Count conflict pairs in grammar.js
grep -c '\[' grammar.js  # rough check; inspect manually
```

Expected: 6 or fewer conflict pairs (down from 8; removed 2 for assignment fix).

---

## Version Bump Verification

After all fixes, all 6 manifest files must show `0.2.0`:

```sh
grep -r '"version"' package.json
grep -r '^version' Cargo.toml
grep -r '^version' pyproject.toml
grep -r '"version"' tree-sitter.json
grep -r 'VERSION' Makefile
grep -r 'VERSION' CMakeLists.txt
```
