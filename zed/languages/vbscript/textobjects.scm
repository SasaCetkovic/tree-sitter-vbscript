(sub_declaration
  (statement_line)* @function.inside) @function.around

(function_declaration
  (statement_line)* @function.inside) @function.around

(property_get_statement
  (statement_line)* @function.inside) @function.around

(property_let_statement
  (statement_line)* @function.inside) @function.around

(property_set_statement
  (statement_line)* @function.inside) @function.around

; Members are separated by newline tokens, so they must be part of the
; repetition. Zed merges all captures of a match into one range. The first
; newline (end of the `Class Name` line) is skipped.
(class_statement
  name: (identifier)
  .
  ["\n" "\r\n" "\r"]
  .
  [(class_statement_group) (comment) "\n" "\r\n" "\r"]* @class.inside) @class.around

; Each comment line is its own node, so this selects a single line.
(comment) @comment.around

(rem_comment) @comment.around
