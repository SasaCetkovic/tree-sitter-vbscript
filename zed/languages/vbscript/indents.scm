; Indent block bodies. @end aligns the closing keyword (End ..., Next, Loop,
; Wend) with the line that opened the block. Opening lines are handled by
; increase_indent_pattern in config.toml, because an unfinished block has no
; node yet.

(sub_declaration
  "end" @end) @indent

(function_declaration
  "end" @end) @indent

(property_get_statement
  "end" @end) @indent

(property_let_statement
  "end" @end) @indent

(property_set_statement
  "end" @end) @indent

(class_statement
  "end" @end) @indent

(with_statement
  "end" @end) @indent

(block_if_statement
  "end" @end) @indent

(elseif_clause) @indent

(else_clause) @indent

; Each Case clause ends where the next one starts, so the next Case line
; aligns with the previous one.
(select_case_statement
  "end" @end) @indent

(case_clause) @indent

(case_else_clause) @indent

(for_statement
  "next" @end) @indent

(for_each_statement
  "next" @end) @indent

(do_loop_statement
  "loop" @end) @indent

(while_wend_statement
  "wend" @end) @indent

(_
  "("
  ")" @end) @indent
