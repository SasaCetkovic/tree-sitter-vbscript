# Feature Specification: VBScript Language Support for Zed Editor

**Feature Branch**: `003-zed-extension`
**Created**: 2026-03-23
**Status**: Draft
**Input**: User description: "I want to use this as a plugin in Zed"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Syntax Highlighting (Priority: P1)

As a developer who writes VBScript in the Zed editor, I want VBScript code to be
displayed with syntax highlighting so that I can visually distinguish keywords,
strings, comments, numbers, and built-in constants at a glance — making code easier
to read and errors easier to spot.

When I open a `.vbs` or `.asp` file in Zed, the code should immediately display
with colors appropriate to each token type, using the active Zed theme.

**Why this priority**: Syntax highlighting is the foundational value of any editor
language extension. Without it, VBScript files display as plain text with no visual
structure. All other language features depend on the grammar being correctly integrated,
making this the mandatory first deliverable.

**Independent Test**: Open any `.vbs` file in Zed after installing the extension.
VBScript keywords, strings, comments, and numbers should render in distinct colors
matching the theme. This is verifiable by visual inspection and delivers immediate
value to any VBScript developer using Zed.

**Acceptance Scenarios**:

1. **Given** a `.vbs` file containing `If x > 0 Then`, **When** opened in Zed,
   **Then** `If` and `Then` are colored as keywords; `x` and `0` have distinct
   colors; no token appears as plain unhighlighted text.
2. **Given** a `.vbs` file with a `' This is a comment` line, **When** opened,
   **Then** the entire comment line (including the `'` sigil) renders as a comment
   token (typically grayed out in most themes).
3. **Given** `Dim greeting: greeting = "Hello"`, **When** opened, **Then** `Dim`
   is a keyword, `greeting` is an identifier, and `"Hello"` is a string (in a
   distinct color from keywords and identifiers).
4. **Given** `True`, `False`, `Nothing`, `Empty`, `Null` appear in code, **When**
   opened, **Then** these built-in constants are highlighted distinctly from
   user-defined variable names.
5. **Given** hex literals like `&HFF` and date literals like `#1/1/2000#`, **When**
   opened, **Then** these render as number or literal tokens — not as plain text.
6. **Given** a REM comment (`REM This is also a comment`), **When** opened, **Then**
   the entire line including `REM` renders as a comment token.

---

### User Story 2 - Language-Aware Editing (Priority: P2)

As a developer editing VBScript in Zed, I want the editor to understand VBScript's
language conventions so that comment toggling, bracket matching, and file type
detection work correctly — reducing friction when writing and navigating VBScript code.

**Why this priority**: Once syntax highlighting is working, these editing features
make the extension genuinely useful for day-to-day VBScript development in Zed.
Comment toggling alone saves significant keystrokes. File type detection ensures
the extension activates automatically without user intervention.

**Independent Test**: Open a `.vbs` file, verify automatic language detection in
the status bar shows "VBScript". Select a line and use the editor's "Toggle Comment"
command; verify the line is prefixed with `'`. Place the cursor next to a `(` and
verify the matching `)` is highlighted.

**Acceptance Scenarios**:

1. **Given** a file with the `.vbs` extension, **When** opened in Zed, **Then** the
   status bar shows "VBScript" as the detected language with no manual selection.
2. **Given** a file with the `.asp` extension, **When** opened, **Then** Zed detects
   it as VBScript.
3. **Given** a VBScript source line, **When** the user invokes "Toggle Line Comment",
   **Then** the line is prefixed with `' `; invoking it again removes the prefix.
4. **Given** a cursor positioned inside `(arguments)`, **When** in the editor,
   **Then** the matching opening and closing parentheses are visually highlighted.

---


### Edge Cases

- How does highlighting behave inside ASP files that mix VBScript with HTML? The
  initial scope covers VBScript highlighting only; HTML injection support is deferred.
- What happens with `.asp` files that contain JavaScript instead of VBScript?
  Highlighting may be incorrect — acceptable behavior for ambiguous file types.
- How do multi-line statements connected by line continuation (` _`) display?
  The continuation character must not break highlighting of the continued expression.
- How does the extension handle very large `.asp` files (>5,000 lines)?
  Highlighting should not cause perceptible lag during editing or file open.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: VBScript control-flow keywords (`If`, `Then`, `Else`, `ElseIf`, `End`,
  `For`, `Do`, `Loop`, `While`, `Wend`, `Next`, `With`, `Select`, `Case`) MUST be
  highlighted as keyword tokens.
- **FR-002**: Declaration keywords (`Sub`, `Function`, `Class`, `Property`, `Dim`,
  `ReDim`, `Const`, `Set`, `Let`, `Call`, `Exit`, `On`, `Error`, `Resume`, `GoTo`,
  `Option`, `Explicit`, `Each`, `In`, `Step`, `To`, `Preserve`) MUST be highlighted
  as keyword tokens.
- **FR-003**: String literals (text between double-quotes, including escaped `""`)
  MUST be highlighted as string tokens.
- **FR-004**: Numeric literals (integers, decimals, hex `&H...`, octal `&O...`, and
  date literals `#...#`) MUST be highlighted as number or literal tokens.
- **FR-005**: Comments — lines starting with `'` (apostrophe) and `REM` statements —
  MUST be highlighted as comment tokens.
- **FR-006**: Built-in constants (`True`, `False`, `Nothing`, `Empty`, `Null`) MUST
  be highlighted as constant tokens, distinct from user-defined identifiers.
- **FR-007**: The extension MUST register `.vbs` and `.asp` as VBScript file
  extensions, causing automatic language detection on file open.
- **FR-008**: The extension MUST declare `'` (apostrophe) as the single-line comment
  prefix for use with Zed's comment-toggle feature.
- **FR-009**: Parenthesis pairs MUST be declared so Zed can highlight matched
  brackets when the cursor is adjacent to one.
- **FR-010**: The extension MUST be loadable in Zed as a local dev extension from
  the repository directory, with syntax highlighting activating on `.vbs` and `.asp`
  files. Marketplace publication is out of scope for this feature.
- **FR-011**: The names declared in `Sub`, `Function`, and `Class` definitions MUST
  be highlighted as a function or type name token, visually distinct from plain
  variable identifiers (e.g., `doWork` in `Sub doWork()` renders differently from
  `x` in `Dim x`).
- **FR-012**: VBScript operators — arithmetic (`+`, `-`, `*`, `/`, `\`, `^`, `Mod`),
  comparison (`=`, `<>`, `<`, `<=`, `>`, `>=`, `Is`), logical (`And`, `Or`, `Not`,
  `Xor`, `Imp`, `Eqv`), and concatenation (`&`) — MUST be highlighted as operator
  tokens.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least 9 distinct visual token categories are highlighted in VBScript
  files: keywords, strings, comments, numbers, built-in constants, identifiers,
  function/type definition names, operators, and punctuation.
- **SC-002**: All 5 built-in constants (`True`, `False`, `Nothing`, `Empty`, `Null`)
  are visually distinct from user-defined variable names across all standard Zed
  themes.
- **SC-003**: `.vbs` and `.asp` files are automatically detected as VBScript in 100%
  of cases — no manual language selection required.
- **SC-004**: Comment toggling via Zed's built-in command correctly prefixes and
  unprefixes lines with `'` — verified across at least 5 representative code samples
  including single statements, block headers, and inline comments.
- **SC-005**: The extension loads successfully as a local dev extension in Zed with
  no errors reported in the Zed log, and `.vbs` files immediately show highlighted
  output.
- **SC-006**: Syntax highlighting on a 1,000-line VBScript file applies within 1
  second of the file opening — no perceptible lag in the editor.

## Clarifications

### Session 2026-03-23

- Q: Should the extension be published to the Zed marketplace, or is local installation sufficient? → A: Out of scope — just make the extension locally installable as a dev extension; skip marketplace publication.
- Q: Should names of Sub, Function, and Class definitions be highlighted as function/type names, distinct from plain variable identifiers? → A: Yes — definition names (Sub, Function, Class) highlighted as a distinct function/type name category.

## Assumptions

- The extension will be packaged within the existing `tree-sitter-vbscript` repository
  (adding extension manifest and query files alongside the grammar), rather than
  creating a separate extension repository. This keeps grammar and highlighting rules
  co-located and versioned together.
- The Zed extension will reference the grammar source from this repository directly;
  Zed compiles the grammar binary at install time.
- Full HTML/VBScript injection (switching highlight rules between HTML and VBScript
  regions within a single ASP file) is out of scope for this initial feature. Only
  pure VBScript highlighting is required.
- The existing repository is public on GitHub, satisfying the Zed marketplace
  submission requirement.
- The complete set of node types available for highlight queries is defined by
  `src/node-types.json` (current state after feature 002-fix-grammar-elements).
- No changes to `grammar.js` are required for this feature — highlight queries
  operate purely on the existing parse tree.
