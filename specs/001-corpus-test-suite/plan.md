# Implementation Plan: Corpus Test Suite

**Branch**: `001-corpus-test-suite` | **Date**: 2026-03-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-corpus-test-suite/spec.md`

## Summary

Add a comprehensive tree-sitter corpus test suite covering all 57 named
grammar rules in `grammar.js`. Tests are organized into 12 files under
`test/corpus/` using medium granularity. Test inputs are derived from the
Microsoft VBScript Language Reference. Known grammar gaps are tracked in
a separate `known_failures.txt` with `:skip` attributes. Negative tests
validate the parser rejects invalid VBScript syntax.

## Technical Context

**Language/Version**: JavaScript (grammar.js), tree-sitter test format (`.txt`)
**Primary Dependencies**: tree-sitter-cli >= 0.25.7
**Storage**: N/A (test files are plain text)
**Testing**: `tree-sitter test` (corpus tests), `npm test` (binding tests)
**Target Platform**: Cross-platform (tree-sitter runs on macOS, Linux, Windows)
**Project Type**: Parser grammar library (tree-sitter)
**Performance Goals**: N/A (test authoring, not runtime performance)
**Constraints**: Test files MUST use tree-sitter corpus format; `:skip`
attribute for known failures; `:error` attribute for negative tests
**Scale/Scope**: 50+ test cases across 12 corpus files covering 57 named rules

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. VBScript Specification Fidelity | PASS | FR-013 requires test inputs from MS VBScript Language Reference |
| II. Grammar Correctness | PASS | Tests validate parse trees match expected structure |
| III. Multi-Binding Compatibility | N/A | Test files don't affect bindings |
| IV. Test Corpus Coverage | PASS | This feature directly implements Principle IV |
| V. Simplicity & Minimalism | PASS | Medium-granularity file organization (12 files) |
| VI. Performance | N/A | Test files don't affect parser performance |
| VII. Semantic Versioning | PASS | Test-only changes use `test:` prefix (no version bump) |

No violations. No complexity justification needed.

## Project Structure

### Documentation (this feature)

```text
specs/001-corpus-test-suite/
├── plan.md              # This file
├── research.md          # Phase 0: tree-sitter test format, VBScript ref
├── data-model.md        # Phase 1: grammar rule → test file mapping
├── quickstart.md        # Phase 1: how to write and run corpus tests
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
test/
└── corpus/
    ├── control_flow.txt       # if/elseif/else, select/case, single-line if
    ├── loops.txt              # for, for each, do/loop, while/wend
    ├── declarations.txt       # dim, redim, const, set, option explicit
    ├── procedures.txt         # function, sub, call, implicit call, exit
    ├── error_handling.txt     # on error, goto, erase
    ├── classes.txt            # class, property get/let/set, access modifiers
    ├── expressions.txt        # binary, unary, assignment, member, parenthesized
    ├── literals.txt           # strings, numbers, booleans, nothing/empty/null,
    │                          # identifiers, comments, line continuations
    ├── with_statement.txt     # with blocks, unqualified member expressions
    ├── conflicts.txt          # 5 conflict zone regression tests
    ├── invalid_syntax.txt     # 10-15 negative tests (:error attribute)
    └── known_failures.txt     # valid VBScript grammar can't yet parse (:skip)
```

**Structure Decision**: Tests-only feature. All new files go under
`test/corpus/`. No changes to `grammar.js`, `src/`, or `bindings/`.

## Complexity Tracking

No violations to justify.
