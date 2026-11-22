' Specific captures must win over the generic (identifier) @variable fallback.

Function Add(a, b)
'        ^ function
'            ^ variable.parameter
    Add = obj.Total(a)
'             ^ function.call
End Function
