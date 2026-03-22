# Data Model: Corpus Test Suite

**Feature**: 001-corpus-test-suite
**Date**: 2026-03-22

## Entities

### Corpus Test File

A `.txt` file under `test/corpus/` containing one or more test cases.

| Attribute | Description |
|-----------|-------------|
| Name | File name matching a grammar subcategory (e.g., `loops.txt`) |
| Location | `test/corpus/<name>.txt` |
| Format | tree-sitter corpus test format |
| Test Cases | 1..N test cases per file |

### Test Case

A single test within a corpus file.

| Attribute | Description |
|-----------|-------------|
| Name | Descriptive test name (e.g., "Simple for loop") |
| Attributes | Optional: `:skip`, `:error`, `:fail-fast` |
| Input | VBScript source code to parse |
| Expected | S-expression of the expected parse tree |

### Grammar Rule

A named production in `grammar.js`.

| Attribute | Description |
|-----------|-------------|
| Node Type | The name used in S-expressions (e.g., `for_statement`) |
| Category | Which corpus file covers this rule |
| Fields | Named children (e.g., `counter`, `start`, `end`, `step`) |
| Hidden | Whether the rule is prefixed with `_` (excluded from direct testing) |

## Rule-to-File Mapping

| Corpus File | Grammar Rules |
|-------------|---------------|
| `control_flow.txt` | block_if_statement, single_line_if_statement, elseif_clause, else_clause, select_case_statement, case_clause, case_else_clause, case_expression_list, range_expression (alias), is_expression (alias) |
| `loops.txt` | for_statement, for_each_statement, do_loop_statement, while_wend_statement |
| `declarations.txt` | declaration_statement, variable_declaration, declared_variable, constant_declaration, constant_definition, set_statement, option_explicit_statement |
| `procedures.txt` | function_declaration, sub_declaration, parameter_list, parameter, call_statement, implicit_call_statement, exit_statement, expression_statement |
| `error_handling.txt` | on_error_statement, goto_statement, erase_statement |
| `classes.txt` | class_statement, class_statement_group, property_get_statement, property_let_statement, property_set_statement |
| `expressions.txt` | assignment_expression, binary_expression, unary_expression, parenthesized_expression, member_expression, call_expression, argument_list |
| `literals.txt` | identifier, string_literal, number_literal, boolean_literal, nothing, empty, null, comment, rem_comment, line_continuation |
| `with_statement.txt` | with_statement, unqualified_member_expression |
| `conflicts.txt` | (cross-cutting: call_expression vs implicit_call_statement, expression vs lvalue, parenthesized_expression vs argument_list, unqualified_member_expression vs member_expression) |
| `invalid_syntax.txt` | (negative tests — no specific grammar rules, validates ERROR nodes) |
| `known_failures.txt` | (valid VBScript the grammar cannot yet parse — rules TBD during implementation) |

## Structural Rules

These rules appear in every test implicitly but also get dedicated
edge-case tests distributed across files:

- `source_file` — Every test wraps in this; edge case: empty file
- `statement_line` — Every statement test; edge case: empty line
- `statement_group` — Colon-separated statements (in `control_flow.txt`)
- `line_label` — Labeled lines (in `procedures.txt`)

## Field Coverage Matrix

| Field Name | Rules Using It | Tested In |
|------------|---------------|-----------|
| `label` | line_label, on_error_statement, goto_statement | procedures, error_handling |
| `object` | with_statement | with_statement |
| `access_modifier` | function/sub_declaration, class_statement, property_*, variable/constant_declaration | procedures, classes, declarations |
| `name` | function/sub_declaration, property_*, class_statement, declared_variable, constant_definition | procedures, classes, declarations |
| `parameters` | function/sub_declaration, property_* | procedures, classes |
| `optional` | parameter | procedures |
| `mechanism` | parameter (byval/byref) | procedures |
| `is_array` | parameter | procedures |
| `condition` | block/single_line_if_statement, elseif_clause, do_loop_statement, while_wend_statement | control_flow, loops |
| `consequence` | single_line_if_statement | control_flow |
| `alternative` | single_line_if_statement | control_flow |
| `counter` | for_statement | loops |
| `start` | for_statement | loops |
| `end` | for_statement | loops |
| `step` | for_statement | loops |
| `element` | for_each_statement | loops |
| `group` | for_each_statement | loops |
| `loop_type` | do_loop_statement | loops |
| `value` | select_case_statement, constant_definition | control_flow, declarations |
| `operator` | binary_expression, is_expression | expressions, control_flow |
| `left` | binary_expression, assignment_expression, set_statement | expressions, declarations |
| `right` | binary_expression, assignment_expression, set_statement | expressions, declarations |
| `function` | implicit_call_statement, call_expression | procedures, expressions |
| `arguments` | implicit_call_statement, call_expression | procedures, expressions |
| `property` | unqualified_member_expression, member_expression | with_statement, expressions |
| `default` | property_get_statement | classes |
| `keyword` | variable_declaration | declarations |
| `dimensions` | declared_variable | declarations |
| `operand` | unary_expression | expressions |
