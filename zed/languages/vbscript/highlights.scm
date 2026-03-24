(comment) @comment
(rem_comment) @comment
(string_literal) @string
(number_literal) @number
(hex_literal) @number
(octal_literal) @number
(date_literal) @string.special
(boolean_literal) @constant.builtin
(nothing) @constant.builtin
(empty) @constant.builtin
(null) @constant.builtin
(function_declaration name: (identifier) @function)
(sub_declaration name: (identifier) @function)
(property_get_statement name: (identifier) @function.method)
(property_let_statement name: (identifier) @function.method)
(property_set_statement name: (identifier) @function.method)
(class_statement name: (identifier) @type)
(declared_variable name: (identifier) @variable)
(constant_definition name: (identifier) @variable)
(parameter name: (identifier) @variable.parameter)
(member_expression property: (identifier) @property)
(binary_expression operator: _ @operator)
(unary_expression operator: _ @operator)
(line_label label: _ @label)
(goto_statement label: _ @label)
(on_error_statement label: _ @label)
"(" @punctuation.bracket
")" @punctuation.bracket
"," @punctuation.delimiter
":" @punctuation.delimiter
; Fallback — must be last
(identifier) @variable
