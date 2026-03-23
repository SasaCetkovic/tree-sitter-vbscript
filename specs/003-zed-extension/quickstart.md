# Quickstart: Verifying the Zed Extension

**Feature**: `003-zed-extension`
**Phase**: 1 — Design
**Date**: 2026-03-23

This guide shows how to verify each part of the Zed extension after implementation.

---

## Prerequisites

```sh
# Must be on the feature branch
git checkout 003-zed-extension

# Zed editor must be installed (https://zed.dev)
# Verify Zed is available
zed --version  # or open Zed from Applications
```

---

## Step 1: Load as Dev Extension in Zed

After creating `extension.toml`, `languages/vbscript/config.toml`, and
`queries/highlights.scm`:

1. Open Zed
2. Open the Command Palette (`Cmd+Shift+P` on macOS)
3. Run: `zed: install dev extension`
4. Navigate to and select the repository root directory

Expected: Zed loads the extension with no errors in the log. The Extensions panel
shows "VBScript" as an installed dev extension.

To check for errors: open Zed's log (`Help > Open Log File`) and search for
"vbscript" — no error lines should appear.

---

## Verify Fix 1: File Type Detection (FR-007, SC-003)

Create a test file and open it in Zed:

```sh
printf "Dim x\nx = 1\n" > /tmp/test_detection.vbs
open /tmp/test_detection.vbs  # or drag into Zed
```

**Expected**: Zed status bar shows "VBScript" as the detected language (lower right
corner of the editor window).

Also test `.asp`:

```sh
printf "Dim x\nx = 1\n" > /tmp/test_detection.asp
open /tmp/test_detection.asp
```

**Expected**: Same — status bar shows "VBScript".

---

## Verify Fix 2: Syntax Highlighting — Keywords (FR-001, FR-002, SC-001)

```sh
cat > /tmp/test_keywords.vbs << 'EOF'
Option Explicit

Sub greet(name)
    If name = "" Then
        MsgBox "No name"
    Else
        MsgBox "Hello " & name
    End If
End Sub

Function add(a, b)
    add = a + b
End Function
EOF
open /tmp/test_keywords.vbs
```

**Expected**:
- `Option`, `Explicit`, `Sub`, `Function`, `If`, `Then`, `Else`, `End` colored as
  keywords (typically purple or blue in most themes)
- `greet`, `name`, `add`, `a`, `b` colored as identifiers/parameters
- `greet` (Sub name) and `add` (Function name) colored as function names (distinct
  from `name` parameter and local variables)

---

## Verify Fix 3: Comments (FR-005, SC-001)

```sh
cat > /tmp/test_comments.vbs << 'EOF'
' This is a comment
REM This is also a comment
Dim x  ' inline comment
x = 1
EOF
open /tmp/test_comments.vbs
```

**Expected**: All three comment lines/portions render in the theme's comment color
(typically gray or green), including the `'` and `REM` prefixes.

---

## Verify Fix 4: String Literals (FR-003, SC-001)

```sh
printf 'greeting = "Hello, World!"\nempty_str = ""\nquoted = "Say ""hello"""\n' > /tmp/test_strings.vbs
open /tmp/test_strings.vbs
```

**Expected**: All three string values (including the `""` escaped quote in the third)
render in the theme's string color (typically orange or green).

---

## Verify Fix 5: Built-in Constants (FR-006, SC-002)

```sh
cat > /tmp/test_constants.vbs << 'EOF'
Dim flag
flag = True
If flag = False Then
    Set obj = Nothing
End If
x = Empty
y = Null
EOF
open /tmp/test_constants.vbs
```

**Expected**: `True`, `False`, `Nothing`, `Empty`, `Null` render in the theme's
constant/builtin color (distinct from `flag`, `obj`, `x`, `y`).

---

## Verify Fix 6: Numeric Literals — Hex, Octal, Date (FR-004, SC-001)

```sh
cat > /tmp/test_literals.vbs << 'EOF'
hexVal = &HFF
bigHex = &H80000000
octVal = &O77
today = #3/23/2026#
withTime = #12/31/1999 11:59:59 PM#
plain = 42
decimal = 3.14
EOF
open /tmp/test_literals.vbs
```

**Expected**: All literal values render in the number/literal color. `&HFF`,
`&H80000000`, `&O77` as numbers; `#3/23/2026#` and `#12/31/1999 11:59:59 PM#`
as special string/literal; `42` and `3.14` as numbers.

---

## Verify Fix 7: Comment Toggle (FR-008, SC-004)

1. Open any `.vbs` file in Zed
2. Place cursor on any code line (e.g., `Dim x`)
3. Press `Cmd+/` (macOS) or check `Edit > Toggle Line Comment`

**Expected**: The line becomes `' Dim x` (prefixed with apostrophe-space). Pressing
again removes the prefix and restores `Dim x`.

---

## Verify Fix 8: Bracket Matching (FR-009)

```sh
printf "result = add(1, multiply(2, 3))\n" > /tmp/test_brackets.vbs
open /tmp/test_brackets.vbs
```

**Expected**: Place cursor adjacent to any `(` or `)` — the matching partner
highlights (typically with a border or background). Works for nested parens.

---

## Verify Fix 9: Operators (FR-012, SC-001)

```sh
cat > /tmp/test_operators.vbs << 'EOF'
x = 1 + 2 * 3
y = x > 0 And x < 100
z = Not (x = y)
s = "Hello" & " " & "World"
EOF
open /tmp/test_operators.vbs
```

**Expected**: `+`, `*`, `>`, `And`, `<`, `Not`, `=` (comparison), `&` render in
the theme's operator color (distinct from keywords and identifiers).

---

## Final Validation

Open a real-world VBScript file (100+ lines) in Zed. Verify:

1. Language detected as "VBScript" in status bar
2. No plain/unhighlighted tokens (except identifiers in themes that don't color them)
3. No Zed error notifications
4. No lag when typing or scrolling
5. Comment toggle works correctly

**Acceptance**: All 9 token categories visually distinguishable, SC-001 through SC-006 met.
