# Implementation Plan: VBScript Language Support for Zed Editor

**Branch**: `003-zed-extension` | **Date**: 2026-03-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-zed-extension/spec.md`

## Summary

Add Zed editor language support for VBScript by creating three files in this repository:
`extension.toml` (extension manifest), `languages/vbscript/config.toml` (language
config), and `queries/highlights.scm` (syntax highlighting rules). No changes to
`grammar.js` are required. The deliverable is a locally loadable Zed dev extension
providing 9 highlight categories, file-type detection for `.vbs`/`.asp`, comment
toggling, and bracket matching. Version bumped from `0.2.0` → `0.3.0` (MINOR: new
editor integration).

## Technical Context

**Language/Version**: Tree-sitter query syntax (`.scm`/Scheme-like DSL); TOML
**Primary Dependencies**: Zed editor (dev extension host); tree-sitter-vbscript
grammar v0.2.0 (this repo, `src/parser.c`); `src/node-types.json` as query reference
**Storage**: N/A (static files committed to repo)
**Testing**: Manual verification in Zed dev mode — open `.vbs` files, visually confirm
highlight categories; no automated test framework exists for highlight queries
**Target Platform**: Zed editor (macOS, Linux; Windows via Zed when available)
**Project Type**: Editor language extension (Zed extension)
**Performance Goals**: Highlighting applies within 1 second on 1,000-line files (SC-006)
**Constraints**: `grammar.js` MUST NOT be modified; highlight queries MUST reference
only node types present in `src/node-types.json`; Zed extension schema version 1
**Scale/Scope**: 3 new files; zero changes to existing grammar, bindings, or tests

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status | Notes |
|-----------|------|--------|-------|
| I. VBScript Spec Fidelity | No invented/omitted grammar constructs | ✅ PASS | grammar.js unchanged; queries are read-only |
| II. Grammar Correctness | extras, precedence, conflicts unchanged | ✅ PASS | No grammar changes |
| III. Multi-Binding Compatibility | All 6 bindings still compile | ✅ PASS | No `src/parser.c` changes |
| IV. Test Corpus Coverage | Grammar changes need corpus tests | ✅ PASS | No grammar changes → no new corpus tests needed. Highlight queries have no tree-sitter test format; manual Zed verification is the only option |
| V. Simplicity & Minimalism | Conflict count ≤ 5; grammar.js ≤ 800 lines | ✅ PASS | No changes to grammar.js |
| VI. Performance | No external scanner; highlights don't affect parse speed | ✅ PASS | No `scanner.c`; query evaluation is Zed's responsibility |
| VII. Semantic Versioning | All 6 manifests bumped consistently | ✅ PASS | `0.2.0` → `0.3.0` (MINOR: new Zed integration; `node-types.json` unchanged) |

## Project Structure

### Documentation (this feature)

```text
specs/003-zed-extension/
├── plan.md              # This file
├── research.md          # Phase 0: Zed extension format, highlight query patterns
├── data-model.md        # Phase 1: file inventory and query mapping
├── quickstart.md        # Phase 1: verification steps in Zed dev mode
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
extension.toml                        # NEW: Zed extension manifest
languages/
└── vbscript/
    └── config.toml                   # NEW: language config (file types, comments, brackets)
queries/
└── highlights.scm                    # NEW: syntax highlight rules (tree-sitter query format)

# Version bumps (0.2.0 → 0.3.0):
package.json
Cargo.toml
pyproject.toml
tree-sitter.json
Makefile
CMakeLists.txt
```

**Structure Decision**: Single-repo integration. All Zed extension files added at
repository root and `languages/`/`queries/` subdirectories, co-located with the grammar.
This follows the pattern of tree-sitter grammar repos that also serve as Zed extensions
directly (e.g., `tree-sitter-bash`, `tree-sitter-ruby` derivatives). No monorepo or
separate extension repo required.

## Complexity Tracking

> No Constitution Check violations — table omitted.
