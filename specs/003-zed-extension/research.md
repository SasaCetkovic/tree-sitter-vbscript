# Research: VBScript Language Support for Zed Editor

**Feature**: `003-zed-extension`
**Phase**: 0 — Technical Research
**Date**: 2026-03-23

## Summary

Three technical decisions govern this feature: (1) Zed extension file structure and
manifest format, (2) tree-sitter highlight query design for VBScript node types, and
(3) version bump strategy. All were resolvable from known Zed extension conventions
and the current `src/node-types.json` inventory.

---

## Decision 1: Zed Extension File Structure

### Decision
Use Zed extension schema version 1 with these files at repo root:

```
extension.toml              # manifest
languages/vbscript/
  config.toml               # language config
queries/
  highlights.scm            # highlight queries
```

### Rationale
Zed extension schema v1 is the current stable format (as of Zed 0.130+). It requires:
- `extension.toml` at repository root — declares the extension, grammar reference, and
  language registration
- `languages/<name>/config.toml` — per-language configuration including file extensions,
  comment syntax, and indentation
- `queries/highlights.scm` — tree-sitter highlight queries at the repo root `queries/`
  directory (Zed resolves queries relative to the grammar root)

The grammar is referenced in `extension.toml` by git repository URL + commit SHA.
Because this extension IS the grammar repository, the grammar block references itself.
Zed will compile `src/parser.c` at install time using its bundled C compiler.

### extension.toml format
```toml
id = "vbscript"
name = "VBScript"
version = "0.3.0"
schema_version = 1
description = "VBScript language support for Zed"
repository = "https://github.com/SasaCetkovic/tree-sitter-vbscript"
authors = ["Sasa Cetkovic <sasa.cetkovic@outlook.cz>"]

[grammars.vbscript]
repository = "https://github.com/SasaCetkovic/tree-sitter-vbscript"
commit = "<git-sha-of-HEAD-on-003-branch>"

[languages.vbscript]
name = "VBScript"
grammar = "vbscript"
path_suffixes = ["vbs", "asp"]
line_comment = "' "
```

### languages/vbscript/config.toml format
```toml
name = "VBScript"
grammar = "vbscript"
path_suffixes = ["vbs", "asp"]
line_comments = ["' "]
tab_size = 4
hard_tabs = false
```

### Alternatives Considered
- **Separate extension repository**: Rejected — co-location simplifies versioning;
  grammar and highlight rules evolve together.
- **schema_version = 0**: Deprecated; not supported by current Zed builds.
- **Inline grammar (no external reference)**: Not supported by Zed extension format —
  grammar must be referenced by git URL.

---

## Decision 2: Highlight Query Design

### Decision
Write `queries/highlights.scm` mapping VBScript node types to standard tree-sitter
highlight capture names. Use only node types present in `src/node-types.json`.

### Capture Name Mapping

The following capture names are the Zed/tree-sitter standard highlight token types:

| VBScript construct | Tree-sitter node(s) | Capture name |
|--------------------|---------------------|--------------|
| Comments (`'`, REM) | `comment`, `rem_comment` | `@comment` |
| Strings | `string_literal` | `@string` |
| Integers, decimals | `number_literal` | `@number` |
| Hex literals | `hex_literal` | `@number` |
| Octal literals | `octal_literal` | `@number` |
| Date literals | `date_literal` | `@string.special` |
| Boolean constants | `boolean_literal` | `@constant.builtin` |
| Nothing/Empty/Null | `nothing`, `empty`, `null` | `@constant.builtin` |
| Sub/Function names | `function_declaration name:`, `sub_declaration name:` | `@function` |
| Property names | `property_get_statement name:`, `property_let_statement name:`, `property_set_statement name:` | `@function.method` |
| Class names | `class_statement name:` | `@type` |
| Declared variable names | `declared_variable name:`, `constant_definition name:` | `@variable` |
| Parameter names | `parameter name:` | `@variable.parameter` |
| Identifiers (fallback) | `identifier` | `@variable` |
| Member property access | `member_expression property:` | `@property` |
| Binary operators | `binary_expression operator:` | `@operator` |
| Unary operators | `unary_expression operator:` | `@operator` |
| Punctuation (parens) | `(`, `)` | `@punctuation.bracket` |
| Punctuation (comma) | `,` | `@punctuation.delimiter` |
| Punctuation (colon) | `:` | `@punctuation.delimiter` |
| Line labels | `line_label` | `@label` |
| Goto labels | `goto_statement label:`, `on_error_statement label:` | `@label` |

### Keyword captures
VBScript keywords are anonymous nodes (not named node types). They must be captured
by literal string match in the query:

```scheme
[
  "if" "then" "else" "elseif" "end"
  "for" "do" "loop" "while" "wend" "next"
  "with" "select" "case"
] @keyword
```

Since grammar uses `ci()` (case-insensitive regex), keyword tokens can appear in any
case. Tree-sitter queries match tokens case-sensitively by default. To handle any-case
matching, use the `#match?` predicate or list all-lowercase forms (tree-sitter stores
the canonical form as matched by the grammar rule, which for `ci()` regex rules is
the actual input text). **Key insight**: since VBScript keywords are matched by `ci()`
regex (not literal strings), they are NOT anonymous nodes in the traditional sense —
they appear in the parse tree as bare keyword tokens that match whatever case the user
typed. The correct capture approach is to use `(keyword_node_type)` patterns matching
the grammar's actual token text.

**Revised approach**: Capture keywords via the grammar's internal representation.
Testing with `npx tree-sitter parse` on sample code shows anonymous keyword nodes
appear as their typed text (e.g., `"If"`, `"Then"`). Use the tree-sitter `#match?`
predicate to match case-insensitively, or capture parent node types that intrinsically
contain keywords.

**Practical decision**: Use the structured node types as keyword proxies where possible:
- `block_if_statement`, `single_line_if_statement` nodes contain keyword tokens —
  but we need the keyword tokens themselves, not the parent nodes.
- The simpler approach: use anonymous node string patterns in queries, relying on
  tree-sitter's built-in case handling. For Zed specifically, all-lowercase patterns
  in `["if" "then" "else"]` will match the stored token text regardless of input case
  because tree-sitter stores the canonical (lowercased) form of anonymous nodes.

**Action needed during implementation**: Verify with `npx tree-sitter parse` whether
anonymous keyword nodes are stored lowercase or as-typed. Adjust query if needed.

### Alternatives Considered
- **`@keyword.control` and `@keyword.storage` subcategories**: More granular; most Zed
  themes don't distinguish these subcategories for VBScript yet. Using `@keyword` for
  all VBScript keywords is simpler and universally supported.
- **Capturing entire statement nodes for keywords**: Would highlight entire statements,
  not just keywords. Wrong approach — captures must target the leaf tokens.
- **`@function.builtin` for VBScript built-in functions** (MsgBox, WScript.Echo, etc.):
  These are identifiers in the grammar (no built-in function table). Out of scope for
  grammar-level highlighting; would require a hardcoded list, deferring to a future
  locals/tags query file.

---

## Decision 3: Version Bump Strategy

### Decision
`0.2.0` → `0.3.0` (MINOR) across all 6 manifest files.

### Rationale
Adding Zed editor integration is new user-facing functionality that does not alter
`node-types.json` (the grammar public API). Per Principle VII:
- MAJOR: Breaking `node-types.json` changes — NO (unchanged)
- MINOR: New functionality without breaking existing trees — YES (adding editor support)
- PATCH: Bug fixes or documentation only — does not apply; this is a feature addition

`0.2.0 → 0.3.0` is correct.

### Alternatives Considered
- **PATCH (0.2.1)**: Could be argued since `node-types.json` is unchanged. Rejected —
  adding Zed integration is a meaningful new capability, not a bug fix.
- **MAJOR (1.0.0)**: Only appropriate if breaking `node-types.json`. Rejected.

---

## Decision 4: Keyword Capture Strategy (Revised)

### Decision
After reflection on how `ci()` regex keywords behave in tree-sitter:

The `ci()` helper generates a character-class regex (e.g., `[iI][fF]`). In tree-sitter,
such tokens are NAMED rules IF they are top-level rules, or ANONYMOUS if they appear
as inline regex literals. Since VBScript keywords like `ci('if')` appear inline in
rule bodies (not as standalone rules), they produce anonymous tokens.

Anonymous tokens in tree-sitter queries are matched by their **exact string value as
typed in the source code** — the parser does not normalize case for anonymous tokens.
This means `["if"]` in a query would only match `if`, not `If` or `IF`.

**Solution**: Capture keywords via their parent statement node types rather than
anonymous token matching. For example:
- Instead of matching `"if"` token, capture `block_if_statement` and mark only the
  keyword positions — but tree-sitter queries can't easily select child anonymous nodes
  by position.

**Best practical approach**: Use `#match?` predicate for case-insensitive anonymous
node matching, OR list all common capitalizations explicitly:
```scheme
["if" "If" "IF" "then" "Then" "THEN" ...]
```

This is verbose but correct. Many real-world VBScript files use title case (`If`, `Then`),
all-caps (`IF`, `THEN`), or all-lowercase (`if`, `then`).

**Preferred approach**: Use `#match?` with a case-insensitive regex:
```scheme
((identifier) @keyword
 (#match? @keyword "^(?i:if|then|else|elseif|...)$"))
```

But this risks false positives (variables named `if` are invalid in VBScript but could
appear in broken code). Better to rely on structural node captures.

**Final decision**: Use both approaches together:
1. For well-known anonymous tokens that appear in very constrained positions, list the
   most common capitalizations.
2. For keyword-like identifiers that the grammar promotes to named types (`boolean_literal`,
   `nothing`, `empty`, `null`), use the named node capture directly.
3. Verify empirically during implementation which capture strategy Zed actually uses.
