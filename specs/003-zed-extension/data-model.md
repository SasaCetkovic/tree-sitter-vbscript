# Data Model: VBScript Language Support for Zed Editor

**Feature**: `003-zed-extension`
**Phase**: 1 — Design
**Date**: 2026-03-23

## Overview

This feature adds three new files to the repository. There is no traditional data
model (no database entities, no API schemas). The "entities" are the Zed extension
configuration artifacts and the highlight query mapping from grammar node types to
visual token categories.

---

## New Files

### `extension.toml` (repository root)

Zed extension manifest. Schema version 1.

| Field | Value | Purpose |
|-------|-------|---------|
| `id` | `"vbscript"` | Unique extension identifier in Zed marketplace |
| `name` | `"VBScript"` | Display name |
| `version` | `"0.3.0"` | Matches grammar version |
| `schema_version` | `1` | Zed extension format version |
| `description` | `"VBScript language support for Zed"` | Shown in Extensions panel |
| `repository` | GitHub URL | Links to source |
| `authors` | `["Sasa Cetkovic <...>"]` | Author attribution |
| `[grammars.vbscript] repository` | GitHub URL | Points to grammar source |
| `[grammars.vbscript] commit` | git SHA | Pinned grammar revision |
| `[languages.vbscript] name` | `"VBScript"` | Language display name |
| `[languages.vbscript] grammar` | `"vbscript"` | References grammar block above |
| `[languages.vbscript] path_suffixes` | `["vbs", "asp"]` | File type detection |
| `[languages.vbscript] line_comment` | `"' "` | Comment toggle prefix |

---

### `languages/vbscript/config.toml`

Per-language editor configuration.

| Field | Value | Purpose |
|-------|-------|---------|
| `name` | `"VBScript"` | Language name |
| `grammar` | `"vbscript"` | Grammar reference |
| `path_suffixes` | `["vbs", "asp"]` | File associations |
| `line_comments` | `["' "]` | Comment toggle (apostrophe + space) |
| `tab_size` | `4` | Default indent size (VBScript convention) |
| `hard_tabs` | `false` | Use spaces for indentation |
| `brackets` | `[["(", ")"]]` | Bracket pairs for bracket matching |

---

### `queries/highlights.scm`

Tree-sitter highlight query file. Maps parse tree node types to semantic token names
using the tree-sitter Scheme query syntax. This is the main implementation artifact.

#### Capture Categories (9 per SC-001)

| Category | Capture Name | Node Types / Patterns |
|----------|-------------|----------------------|
| Comments | `@comment` | `comment`, `rem_comment` |
| Strings | `@string` | `string_literal` |
| Numbers | `@number` | `number_literal`, `hex_literal`, `octal_literal` |
| Special literals | `@string.special` | `date_literal` |
| Built-in constants | `@constant.builtin` | `boolean_literal`, `nothing`, `empty`, `null` |
| Function/Sub names | `@function` | `function_declaration name:`, `sub_declaration name:` |
| Property names | `@function.method` | `property_get_statement name:`, `property_let_statement name:`, `property_set_statement name:` |
| Type/Class names | `@type` | `class_statement name:` |
| Operators | `@operator` | `binary_expression operator:`, `unary_expression operator:` |
| Keywords | `@keyword` | anonymous keyword tokens (see Decision 4 in research.md) |
| Identifiers | `@variable` | `identifier` (fallback), `declared_variable name:`, `constant_definition name:` |
| Parameters | `@variable.parameter` | `parameter name:` |
| Member properties | `@property` | `member_expression property:` |
| Punctuation | `@punctuation.bracket` | `(`, `)` |
| Punctuation | `@punctuation.delimiter` | `,`, `:` |
| Labels | `@label` | `line_label`, `goto_statement label:`, `on_error_statement label:` |

> Note: `@string.special` for `date_literal` counts as part of the "numbers" or
> "special literals" category (theme-dependent rendering). The 9 SC-001 categories
> map as: keywords, strings, comments, numbers (including date), built-in constants,
> identifiers, function/type names, operators, punctuation.

#### Node Type Coverage from `src/node-types.json`

| Named node | Captured as | Query pattern |
|------------|-------------|---------------|
| `comment` | `@comment` | `(comment) @comment` |
| `rem_comment` | `@comment` | `(rem_comment) @comment` |
| `string_literal` | `@string` | `(string_literal) @string` |
| `number_literal` | `@number` | `(number_literal) @number` |
| `hex_literal` | `@number` | `(hex_literal) @number` |
| `octal_literal` | `@number` | `(octal_literal) @number` |
| `date_literal` | `@string.special` | `(date_literal) @string.special` |
| `boolean_literal` | `@constant.builtin` | `(boolean_literal) @constant.builtin` |
| `nothing` | `@constant.builtin` | `(nothing) @constant.builtin` |
| `empty` | `@constant.builtin` | `(empty) @constant.builtin` |
| `null` | `@constant.builtin` | `(null) @constant.builtin` |
| `function_declaration` | `@function` (name field only) | `(function_declaration name: (identifier) @function)` |
| `sub_declaration` | `@function` (name field only) | `(sub_declaration name: (identifier) @function)` |
| `property_get_statement` | `@function.method` (name) | `(property_get_statement name: (identifier) @function.method)` |
| `property_let_statement` | `@function.method` (name) | `(property_let_statement name: (identifier) @function.method)` |
| `property_set_statement` | `@function.method` (name) | `(property_set_statement name: (identifier) @function.method)` |
| `class_statement` | `@type` (name field only) | `(class_statement name: (identifier) @type)` |
| `declared_variable` | `@variable` (name field only) | `(declared_variable name: (identifier) @variable)` |
| `constant_definition` | `@variable` (name field only) | `(constant_definition name: (identifier) @variable)` |
| `parameter` | `@variable.parameter` (name) | `(parameter name: (identifier) @variable.parameter)` |
| `binary_expression` | `@operator` (operator field) | `(binary_expression operator: _ @operator)` |
| `unary_expression` | `@operator` (operator field) | `(unary_expression operator: _ @operator)` |
| `member_expression` | `@property` (property field) | `(member_expression property: (identifier) @property)` |
| `identifier` | `@variable` (fallback) | `(identifier) @variable` |
| `line_label` | `@label` | `(line_label label: _ @label)` |
| `goto_statement` | `@label` (label field) | `(goto_statement label: _ @label)` |

---

## Version Bump

| File | Before | After |
|------|--------|-------|
| `package.json` | `"version": "0.2.0"` | `"version": "0.3.0"` |
| `Cargo.toml` | `version = "0.2.0"` | `version = "0.3.0"` |
| `pyproject.toml` | `version = "0.2.0"` | `version = "0.3.0"` |
| `tree-sitter.json` | `"version": "0.2.0"` | `"version": "0.3.0"` |
| `Makefile` | `VERSION := 0.2.0` | `VERSION := 0.3.0` |
| `CMakeLists.txt` | `VERSION "0.2.0"` | `VERSION "0.3.0"` |
