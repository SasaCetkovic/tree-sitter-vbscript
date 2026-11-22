; When several patterns match the same node, Zed uses the LAST one, so this
; generic fallback must come first and more specific patterns after it.
; Same as queries/highlights.scm, plus the Zed captures @boolean,
; @constant and @variable.special.
(identifier) @variable

((identifier) @variable.special
  (#match? @variable.special "^[Mm][Ee]$"))

(comment) @comment
(rem_comment) @comment
(string_literal) @string
(number_literal) @number
(hex_literal) @number
(octal_literal) @number
(date_literal) @string.special
(boolean_literal) @constant.builtin @boolean
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
(constant_definition name: (identifier) @constant)
(parameter name: (identifier) @variable.parameter)
(member_expression property: (identifier) @property)
(unqualified_member_expression property: (identifier) @property)
(call_expression function: (identifier) @function.call)
(call_expression function: (member_expression property: (identifier) @function.call))
"." @punctuation.delimiter
"=" @operator
(binary_expression operator: _ @operator)
(unary_expression operator: _ @operator)
(line_label label: _ @label)
(goto_statement label: _ @label)
(on_error_statement label: _ @label)
"(" @punctuation.bracket
")" @punctuation.bracket
"," @punctuation.delimiter
":" @punctuation.delimiter
; Control flow
"if" @keyword
"then" @keyword
"else" @keyword
"elseif" @keyword
"end" @keyword
"for" @keyword
"to" @keyword
"step" @keyword
"next" @keyword
"each" @keyword
"in" @keyword
"do" @keyword
"while" @keyword
"until" @keyword
"loop" @keyword
"wend" @keyword
"exit" @keyword
"select" @keyword
"case" @keyword
"with" @keyword
; Declaration / definition
"sub" @keyword
"function" @keyword
"class" @keyword
"property" @keyword
"get" @keyword
"set" @keyword
"let" @keyword
"dim" @keyword
"redim" @keyword
"preserve" @keyword
"const" @keyword
; Access modifiers and parameter qualifiers
"public" @keyword
"private" @keyword
"default" @keyword
"byval" @keyword
"byref" @keyword
"optional" @keyword
; Statement keywords
"call" @keyword
"new" @keyword
"erase" @keyword
"goto" @keyword
"on" @keyword
"error" @keyword
"resume" @keyword
"option" @keyword
"explicit" @keyword
