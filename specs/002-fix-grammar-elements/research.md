# Research: Fix Missing VBScript Grammar Elements

**Feature**: `002-fix-grammar-elements`
**Phase**: 0 — Technical Research
**Date**: 2026-03-22

## Summary

All four fix categories have known root causes documented in `test/corpus/known_failures.txt`.
This research confirms the implementation approach, resolves technical unknowns, and
documents alternatives considered.

---

## Fix 1: Extras Regex (`/[\s\t]/` → `/[ \t]/`)

### Decision
Change `extras` from `/[\s\t]/` to `/[ \t]/` in `grammar.js` line 21.

### Rationale
JavaScript's `\s` character class matches ALL Unicode whitespace, including:
- `\t` (tab)
- `\n` (newline / LF)
- `\r` (carriage return / CR)
- `\f` (form feed)
- `\v` (vertical tab)
- `\u00a0` (non-breaking space), and others

The tree-sitter `extras` array defines tokens that can appear between any two tokens
and are silently skipped. When `\n` is in `extras`, newline characters are consumed
before `$._terminator` can match them. This prevents ALL line-based constructs from
working: `block_if_statement` requires `$._terminator` after `Then`, and
`option_explicit_statement` requires `$._terminator` at the end.

The fix `/[ \t]/` (literal space + tab only) restores `\n`/`\r`/`\r\n` as significant
tokens that match `$._terminator`. No other fix can achieve this — the terminator
rule REQUIRES newlines to be significant.

### Impact on Existing Tests
All 132 passing tests were written with the buggy extras and produce trees that match
the current (buggy) parser output. The `--update` flag was used to capture actual
parser output. After the extras fix:
- Tests that did NOT rely on block construct parsing (vast majority): should continue
  passing unchanged — spaces and tabs between tokens still work.
- `block_if_statement`, `option_explicit_statement`, `elseif_clause`, `else_clause`
  tests in `known_failures.txt`: will now produce correct trees.
- `control_flow.txt` single_line_if tests: must be reviewed — currently the parser
  treats all `If...Then` as single-line; after the fix, only `If...Then <stmt>` on one
  line is single-line, and `If...Then\n...\nEnd If` is block.

### Alternatives Considered
- **Add `$._terminator` to extras**: Would make terminator available everywhere but
  not fix the root cause — `\n` would still be consumed before `_terminator` matches.
- **Use `field()` to require explicit `\n` tokens**: Overly invasive; would require
  changing dozens of rules.
- **Add precedence to `block_if_statement`**: Does not fix the root cause; `_terminator`
  still never fires even with higher precedence if `\n` is consumed as extras.

---

## Fix 2: `word` Property for Keyword Disambiguation

### Decision
Add `word: $ => $.identifier` as a top-level property in `grammar.js`.

### Rationale
The tree-sitter `word` property designates a terminal rule as the "keyword" rule.
When `word: $ => $.identifier` is declared:
- The lexer knows that the `identifier` pattern (`/[a-zA-Z_][a-zA-Z0-9_]*/`) is the
  "base" word token.
- Any other terminal rule whose pattern is a strict subset of identifier (i.e., whose
  strings all match the identifier regex) is treated as a "keyword" and takes priority
  over `identifier` when the input matches.
- `boolean_literal` (`[tT][rR][uU][eE]` or `[fF][aA][lL][sS][eE]`), `nothing`,
  `empty`, and `null` all match the identifier regex — they ARE identifiers by shape.
  Without `word`, the `identifier` regex wins; with `word`, these keyword rules win.

This is the standard tree-sitter mechanism for reserved words. It does NOT require
adding reserved word checks anywhere else in the grammar.

### Effect on Existing Tests
All existing tests that use `True`, `False`, `Nothing`, `Empty`, `Null` as identifiers
(e.g., variable names) would break — but VBScript does not allow these as variable names
(they are reserved). No existing passing test uses these as identifiers. The 5 tests in
`known_failures.txt` that are currently skipped will become passing.

### Alternatives Considered
- **Inline `ci()` checks in identifier rule**: Would require modifying every rule that
  uses `$.identifier` to exclude keywords — not scalable.
- **Regex negative lookahead in identifier**: tree-sitter does not support lookahead in
  terminal rules in the same way; would produce incorrect results.
- **Explicit precedence on keyword rules**: Does not fix the lexer-level disambiguation;
  only affects parse tree resolution, not tokenization.

---

## Fix 3: Assignment Expression Disambiguation

### Decision
Remove `assignment_expression` from `_expression`. Add it directly to `_statement`
with `prec.dynamic(1, ...)`. Remove the two now-unnecessary conflict pairs
`[$._expression, $._lvalue]` and `[$._primary_expression, $._lvalue]`.

### Rationale
VBScript assignment is a STATEMENT, not an expression. Unlike C/JavaScript, `x = 5`
in VBScript is only valid at statement level — it cannot appear as a sub-expression
(e.g., `if (x = 5)` is ambiguous VBScript where `= 5` is comparison, not assignment).

By removing `assignment_expression` from `_expression`:
1. In condition context (`field('condition', $._expression)`), `x = 5` CANNOT be parsed
   as assignment — it MUST be `binary_expression` (comparison `=`). ✅
2. In statement context (`$._statement` → `choice(..., $.assignment_expression, ...)`),
   `x = 5` CAN be parsed as assignment_expression. ✅

The `prec.dynamic(1, ...)` wrapper on `assignment_expression` tells tree-sitter's GLR
engine to prefer `assignment_expression` over `expression_statement(binary_expression)`
when both are valid alternatives in `_statement.choice()`. Dynamic precedence is a
tiebreaker applied AFTER static precedence, specifically for GLR disambiguation.

If `prec.dynamic` alone is insufficient and tree-sitter still reports ambiguity, the
fallback is to add `[$.assignment_expression, $.expression_statement]` to the conflicts
array (one new conflict pair, still within the ≤ 8 ceiling).

### Effect on Existing Tests
- All existing `Let x = 5` tests: `assignment_expression` now comes from `_statement`
  directly, not through `_expression`. The S-expression tree structure is identical
  since `expression_statement(assignment_expression(...))` still wraps correctly.

Wait — with assignment removed from `_expression`: `expression_statement: $ => $._expression`
no longer includes assignment. We keep `expression_statement` for non-assignment expressions.
Assignment goes directly into `_statement` as its own alternative.

But the expected S-expression in corpus tests shows:
```
(expression_statement
  (assignment_expression ...))
```

To preserve this: either keep `expression_statement: $ => choice($.assignment_expression, $._expression)`,
or change `assignment_expression` directly in `_statement` and update corpus tests.

**Chosen approach**: Change `expression_statement` to:
```js
expression_statement: $ => choice(
    prec.dynamic(1, $.assignment_expression),
    $._expression
),
```
This preserves the `expression_statement(assignment_expression(...))` tree structure
while ensuring assignment wins. The `assignment_expression` continues to be reached
through `expression_statement`, which is in `_statement`. Remove it from `_expression`.

### member_expression Bug Fix (FR-009a)
With assignment now correctly parsed, `x = obj.Name`:
- `x` → `_lvalue` (identifier)
- `= obj.Name` → `_expression` where `obj.Name` → `member_expression(obj, Name)`
- Result: `expression_statement(assignment_expression(x, member_expression(obj, Name)))` ✅

Previously (buggy): `member_expression(binary_expression(x, obj), Name)` because the
parser tried to parse `x = obj` as the LHS of member_expression via binary_expression.

### Alternatives Considered
- **`prec.dynamic` on `assignment_expression` inside `_expression`**: Does not fix
  condition context — assignment would still win over comparison in `If x = 5 Then`.
- **Separate `assignment_statement` rule (not `expression_statement`)**: Breaks all
  existing corpus tests that expect `expression_statement(assignment_expression(...))`.
  Rejected to minimize test churn.
- **Integer precedence override**: `prec.right(100, ...)` on `assignment_expression` —
  integer and named precedences interact; risky without detailed tree-sitter internals
  knowledge. The `prec.dynamic` approach is the documented way to handle this.

---

## Fix 4: Missing Literal Types

### Decision

| Type | Rule Name | Regex / Pattern |
|------|-----------|-----------------|
| Hex literal | `hex_literal` | `/&[hH][0-9a-fA-F]+/` |
| Octal literal | `octal_literal` | `/&[oO][0-7]+/` |
| Date/time literal | `date_literal` | `/#[^#\n\r]+#/` |

### Rationale
All three are simple terminals with unambiguous delimiters:
- **Hex**: `&H` or `&h` prefix + one or more hex digits. The `&` sigil is unique (no
  other VBScript construct starts with `&`). Case-insensitive prefix per VBScript spec.
- **Octal**: `&O` or `&o` prefix + one or more octal digits. Same `&` sigil exclusivity.
  Note: `&O` and `&H` are distinguishable by the second character.
- **Date**: `#...#` delimiters. The content is ANY character except `#`, `\n`, `\r` —
  the grammar does NOT validate the date format (FR-013 explicitly allows this). Using
  `[^#\n\r]+` avoids consuming newlines (which would interfere with `_terminator`).

These are added to `_primary_expression` alongside `number_literal`, `string_literal`,
`boolean_literal`, `nothing`, `empty`, and `null`.

### Interaction with Existing Rules
- `number_literal: $ => /\d+(\.\d+)?/` — no conflict since hex/octal start with `&`.
- `binary_expression` with `&` concatenation operator: `&` followed by a letter could
  be `&HFF` (hex literal) or `& expr` (concatenation). Since `hex_literal` matches
  `/&[hH][0-9a-fA-F]+/` as a single token, the lexer will prefer it over treating `&`
  as the concatenation operator when `H` follows. This is correct VBScript behavior.
- `date_literal` `#` delimiter: no other VBScript construct uses `#`, so no conflict.

### Alternatives Considered
- **Unified `number_literal` for all numerics**: Rejected — spec SC-002 requires
  separate named node types for structural distinguishability by downstream tools.
- **Content-validating date regex**: Rejected — grammar should tokenize, not validate.
  A regex like `/#\d{1,2}\/\d{1,2}\/\d{4}...#/` would reject valid date strings
  that the VBScript runtime accepts. `/#[^#\n\r]+#/` is simpler and correct.
- **External scanner for date literals**: Rejected — Principle VI says no external
  scanner without concrete justification; the simple regex approach works.

---

## Corpus Test Strategy

The 12 `:skip` tests in `test/corpus/known_failures.txt` will be promoted as follows:

| Known Failure Test | Target File | Action |
|--------------------|-------------|--------|
| Option Explicit statement | `test/corpus/declarations.txt` | Promote: remove `:skip`, add to declarations.txt |
| Block If statement | `test/corpus/control_flow.txt` | Promote: update expected tree, add to control_flow.txt |
| Block If with ElseIf | `test/corpus/control_flow.txt` | Promote: update expected tree, add to control_flow.txt |
| Boolean literal True | `test/corpus/literals.txt` | Promote: update expected tree, add to literals.txt |
| Boolean literal False | `test/corpus/literals.txt` | Promote: update expected tree, add to literals.txt |
| Nothing literal | `test/corpus/literals.txt` | Promote: update expected tree, add to literals.txt |
| Empty literal | `test/corpus/literals.txt` | Promote: update expected tree, add to literals.txt |
| Null literal | `test/corpus/literals.txt` | Promote: update expected tree, add to literals.txt |
| Assignment expression without Let | `test/corpus/expressions.txt` | Promote: update expected tree, add to expressions.txt |
| Hex literal | `test/corpus/literals.txt` | Promote (new grammar rule): add to literals.txt |
| Octal literal | `test/corpus/literals.txt` | Promote (new grammar rule): add to literals.txt |
| Date literal | `test/corpus/literals.txt` | Promote (new grammar rule): add to literals.txt |

After promotion, `known_failures.txt` will be empty (or contain only the comment header).

---

## Version Bump

This feature adds new named node types (`hex_literal`, `octal_literal`, `date_literal`)
to `src/node-types.json`. This is a MINOR bump per Principle VII: new types added, no
existing types removed or renamed.

Current version: `0.1.0` → New version: `0.2.0`

Files requiring version bump (all 6 manifests):
- `package.json`
- `Cargo.toml`
- `pyproject.toml`
- `tree-sitter.json`
- `Makefile`
- `CMakeLists.txt`
