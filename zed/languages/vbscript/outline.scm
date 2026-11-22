; The `.` anchors keep the keyword of the closing `End ...` line from matching.

(class_statement
  access_modifier: _? @context
  "class" @context
  .
  name: (identifier) @name) @item

(sub_declaration
  access_modifier: _? @context
  "sub" @context
  .
  name: (identifier) @name) @item

(function_declaration
  access_modifier: _? @context
  "function" @context
  .
  name: (identifier) @name) @item

(property_get_statement
  access_modifier: _? @context
  default: _? @context
  "property" @context
  .
  "get" @context
  .
  name: (identifier) @name) @item

(property_let_statement
  access_modifier: _? @context
  "property" @context
  .
  "let" @context
  .
  name: (identifier) @name) @item

(property_set_statement
  access_modifier: _? @context
  "property" @context
  .
  "set" @context
  .
  name: (identifier) @name) @item
