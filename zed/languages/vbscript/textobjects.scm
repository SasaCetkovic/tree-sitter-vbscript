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

(class_statement
  (class_statement_group)* @class.inside) @class.around

(comment)+ @comment.around

(rem_comment)+ @comment.around
