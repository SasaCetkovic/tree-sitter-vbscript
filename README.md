# tree-sitter-vbscript

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[Tree-sitter](https://tree-sitter.github.io/tree-sitter/) grammar for [VBScript](https://learn.microsoft.com/en-us/previous-versions/t0aew7h6(v=vs.85)) — the scripting language used in Classic ASP, Windows Script Host, and HTA applications.

## Features

- Full VBScript syntax support: variables, constants, control flow, procedures, classes, error handling
- Case-insensitive keyword matching (`If`, `IF`, `if` all work)
- File types: `.vbs`, `.asp`
- Six language bindings: Node.js, Rust, Python, Go, Swift, C
- Zed editor extension with syntax highlighting, outline, and code folding

## Supported constructs

| Category | Constructs |
|----------|-----------|
| Declarations | `Dim`, `ReDim [Preserve]`, `Const`, `Public`, `Private` |
| Control flow | `If/ElseIf/Else/End If`, `Select Case`, single-line `If` |
| Loops | `For/Next`, `For Each/Next`, `Do/Loop`, `While/Wend` |
| Procedures | `Sub`, `Function`, `Property Get/Let/Set` |
| Classes | `Class/End Class`, `Public`/`Private` members |
| Error handling | `On Error Resume Next`, `On Error GoTo 0` |
| Object model | `Set`, `New`, `With/End With`, `Nothing`, `Empty`, `Null` |
| Literals | Strings, numbers, hex (`&HFF`), octal (`&O77`), dates (`#1/1/2000#`), booleans |
| Comments | `'` tick-style and `REM` keyword |

## Installation

### Node.js

```bash
npm install tree-sitter-vbscript
```

```js
const Parser = require('tree-sitter')
const VBScript = require('tree-sitter-vbscript')

const parser = new Parser()
parser.setLanguage(VBScript)

const tree = parser.parse(`
Dim x
x = 42
WScript.Echo x
`)
console.log(tree.rootNode.toString())
```

### Rust

```toml
[dependencies]
tree-sitter-vbscript = "0.4"
```

```rust
use tree_sitter::Parser;

fn main() {
    let mut parser = Parser::new();
    parser.set_language(&tree_sitter_vbscript::LANGUAGE.into()).unwrap();
    let tree = parser.parse("Dim x\nx = 42\n", None).unwrap();
    println!("{}", tree.root_node().to_sexp());
}
```

### Python

```bash
pip install tree-sitter-vbscript
```

```python
import tree_sitter_vbscript as tsvbs
from tree_sitter import Language, Parser

parser = Parser(Language(tsvbs.language()))
tree = parser.parse(b"Dim x\nx = 42\n")
print(tree.root_node.sexp())
```

### Go

```bash
go get github.com/SasaCetkovic/tree-sitter-vbscript/bindings/go
```

### Swift (Swift Package Manager)

```swift
.package(url: "https://github.com/SasaCetkovic/tree-sitter-vbscript", from: "0.4.0")
```

## Zed Extension

Install from the Zed extension registry: search for **VBScript** in Extensions.

Or load as a dev extension pointing to this repository.

## Development

```bash
# Edit grammar.js, then:
npx tree-sitter generate   # regenerate parser
npx tree-sitter test       # run corpus tests
npm start                  # interactive playground
```

## License

[MIT](LICENSE)
