# Data Model: Fix Missing VBScript Grammar Elements

**Feature**: `002-fix-grammar-elements`
**Phase**: 1 — Design
**Date**: 2026-03-22

## Overview

This feature modifies `grammar.js` (the single source of truth for the grammar) and
`test/corpus/*.txt` files. The "data model" for a grammar project is the inventory of
grammar rules: their names, types (named vs hidden), fields, and relationships.

---

## Modified Grammar Properties

### `extras` Array (line 21)

| Before | After | Reason |
|--------|-------|--------|
| `/[\s\t]/` | `/[ \t]/` | JavaScript `\s` includes `\n`/`\r`, preventing `_terminator` from firing |

### `word` Property (new)

| Property | Value | Effect |
|----------|-------|--------|
| `word` | `$ => $.identifier` | Enables keyword extraction; `boolean_literal`, `nothing`, `empty`, `null` take precedence over `identifier` at lexer level |

### `conflicts` Array Changes

Pairs REMOVED (assignment no longer in `_expression`):
- `[$._expression, $._lvalue]`
- `[$._primary_expression, $._lvalue]`

Net change: 8 → 6 conflict pairs (improvement).

Possible new pair (if `prec.dynamic` insufficient):
- `[$.assignment_expression, $.expression_statement]` — would restore to 7.

---

## Modified Grammar Rules

### `expression_statement`

| Aspect | Before | After |
|--------|--------|-------|
| Definition | `$ => $._expression` | `$ => choice(prec.dynamic(1, $.assignment_expression), $._expression)` |
| Purpose | Wraps any expression as statement | Also wraps assignment_expression with higher dynamic priority |

### `_expression`

| Aspect | Before | After |
|--------|--------|-------|
| Members | Includes `$.assignment_expression` | Removes `$.assignment_expression` |
| New members | — | Adds `$.hex_literal`, `$.octal_literal`, `$.date_literal` via `_primary_expression` |

### `_primary_expression`

| Aspect | Before | After |
|--------|--------|-------|
| Members | `identifier`, `string_literal`, `number_literal`, `nothing`, `empty`, `null`, `boolean_literal` | + `hex_literal`, `octal_literal`, `date_literal` |

---

## New Grammar Rules

### `hex_literal`

| Attribute | Value |
|-----------|-------|
| Rule type | Named terminal |
| Pattern | `/&[hH][0-9a-fA-F]+/` |
| Supertype | `_primary_expression` → `_expression` |
| Spec reference | VBScript Language Reference: Numeric Literals, `&H` prefix |
| node-types.json | Named node added: `{ "type": "hex_literal", "named": true }` |
| Fields | None (leaf terminal) |
| Example | `&HFF`, `&h80000000`, `&HDEADBEEF` |

### `octal_literal`

| Attribute | Value |
|-----------|-------|
| Rule type | Named terminal |
| Pattern | `/&[oO][0-7]+/` |
| Supertype | `_primary_expression` → `_expression` |
| Spec reference | VBScript Language Reference: Numeric Literals, `&O` prefix |
| node-types.json | Named node added: `{ "type": "octal_literal", "named": true }` |
| Fields | None (leaf terminal) |
| Example | `&O77`, `&o0`, `&O777` |

### `date_literal`

| Attribute | Value |
|-----------|-------|
| Rule type | Named terminal |
| Pattern | `/#[^#\n\r]+#/` |
| Supertype | `_primary_expression` → `_expression` |
| Spec reference | VBScript Language Reference: Date/Time Literals, `#` delimiter |
| node-types.json | Named node added: `{ "type": "date_literal", "named": true }` |
| Fields | None (leaf terminal) |
| Example | `#1/1/2000#`, `#12/31/1999 11:59:59 PM#`, `#March 22, 2026#` |

---

## Fixed Grammar Rules (Behavior Changes, No Structural Change)

These rules exist in the grammar but currently produce incorrect parse trees. After the
`extras` fix and `word` property addition, they will produce correct trees.

### `block_if_statement`

| Field | Type | Notes |
|-------|------|-------|
| `condition` | `_expression` | The if condition (before `Then`) |
| body | `repeat(statement_line)` | Multi-line body between `Then\n` and `ElseIf`/`Else`/`End If` |
| `elseif_clause` | `repeat(elseif_clause)` | Zero or more ElseIf clauses |
| `else_clause` | `optional(else_clause)` | Optional Else clause |

**Bug**: Currently parses as `single_line_if_statement` because `\n` after `Then` is
consumed by extras. Fix: change extras → `\n` becomes `_terminator`.

### `option_explicit_statement`

| Field | Type | Notes |
|-------|------|-------|
| (no fields) | — | Keyword-only statement |

**Bug**: Currently parses as `implicit_call_statement(option, [explicit])`.
Fix: change extras → `\n` after `Explicit` becomes `_terminator`.

### `elseif_clause`

| Field | Type | Notes |
|-------|------|-------|
| `condition` | `_expression` | The ElseIf condition |
| body | `repeat(statement_line)` | Multi-line body |

**Bug**: Currently produces ERROR nodes (unreachable from `block_if_statement`).

### `else_clause`

| Field | Type | Notes |
|-------|------|-------|
| body | `repeat(statement_line)` | Multi-line body |

**Bug**: Currently unreachable from `block_if_statement`. Fixed by extras change.

### `boolean_literal`

| Values | Node type |
|--------|-----------|
| `True`, `False` (case-insensitive) | `boolean_literal` |

**Bug**: Parses as `identifier`. Fix: add `word: $ => $.identifier`.

### `nothing`, `empty`, `null`

| Keyword | Node type |
|---------|-----------|
| `Nothing` | `nothing` |
| `Empty` | `empty` |
| `Null` | `null` |

**Bug**: All parse as `identifier`. Fix: add `word: $ => $.identifier`.

### `assignment_expression`

| Field | Type | Notes |
|-------|------|-------|
| `left` | `_lvalue` | Assignment target (identifier, member_expression, call_expression) |
| `right` | `_expression` | Assigned value |
| Let keyword | optional | `ci('let')` prefix (optional per VBScript spec) |

**Bug**: `x = 5` (without `Let`) parses as `binary_expression`. Fix: restructure
`expression_statement` to include assignment with `prec.dynamic(1, ...)`.

---

## `node-types.json` Change Summary

New named nodes added (MINOR semver change):
```json
{ "type": "hex_literal", "named": true }
{ "type": "octal_literal", "named": true }
{ "type": "date_literal", "named": true }
```

No existing named nodes removed or renamed.
No existing field names changed.
