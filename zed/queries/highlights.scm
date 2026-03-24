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
(binary_expression operator: _ @operator)
(unary_expression operator: _ @operator)
(identifier) @variable
