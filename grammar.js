/**
 * @file VBScript grammar for the tree-sitter parsing library
 * @author Sasa Cetkovic <sasa.cetkovic@outlook.cz>
 * @license MIT
 */

 // Helper for creating case-insensitive keywords
 const ci = keyword => new RegExp(
   keyword.split('').map(c => `[${c.toLowerCase()}${c.toUpperCase()}]`).join('')
 );

const kw = keyword => alias(ci(keyword), keyword);


/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
    name: 'vbscript',

    extras: $ => [
        $.comment,
        /[ \t]/,
        $.line_continuation,
    ],

    word: $ => $.identifier,

    precedences: $ => [
        ['assignment'],
        ['imp'],
        ['eqv'],
        ['xor'],
        ['or'],
        ['and'],
        ['not'],
        ['comparison', 'is'],
        ['concatenation'],
        ['addition'],
        ['modulo'],
        ['integer_division'],
        ['multiplication'],
        ['unary'],
        ['exponent'],
        [
            'member',
            'call'
        ]
    ],

    conflicts: $ => [
        // Ambiguity between an l-value (assignment target) and a primary
        // expression when followed by `=` — identifier and member_expression
        // can be either. prec.dynamic(1) on assignment_expression in
        // expression_statement resolves the ambiguity in favour of assignment
        // at statement level.
        [$._lvalue, $._primary_expression],
        [$._lvalue, $._expression],
    ],

    supertypes: $ => [
        $._statement,
        $._expression,
        $._class_statement,
    ],

    rules: {
        source_file: $ => seq(
            optional($.option_explicit_statement),
            repeat($.statement_line)
        ),

        option_explicit_statement: $ => seq(
            kw('option'),
            kw('explicit'),
            $._terminator
        ),

        statement_group: $ => prec.left(seq(
            $._statement,
            repeat(seq(':', $._statement))
        )),

        statement_line: $ => seq(
            repeat($.line_label),
            optional($.statement_group),
            $._terminator
        ),

        line_label: $ => prec(1, seq(
            field('label', choice($.identifier, $.number_literal)),
            ':'
        )),

        _statement: $ => choice(
            $.rem_comment, // REM is a statement, not an extra
            $.with_statement,
            $.on_error_statement,
            $.block_if_statement,
            $.single_line_if_statement,
            $.select_case_statement,
            $.for_statement,
            $.for_each_statement,
            $.do_loop_statement,
            $.while_wend_statement,
            $.exit_statement,
            $.erase_statement,
            $.goto_statement,
            $.declaration_statement,
            $.class_statement,
            $.function_declaration,
            $.sub_declaration,
            $.set_statement,
            $.call_statement,
            $.expression_statement,
            $.implicit_call_statement,
        ),

        // Statements
        with_statement: $ => seq(
            kw('with'),
            field('object', $._expression),
            $._terminator,
            repeat($.statement_line),
            kw('end'),
            kw('with')
        ),

        on_error_statement: $ => seq(
            kw('on'),
            kw('error'),
            choice(
                seq(kw('resume'), kw('next')),
                seq(kw('goto'), field('label', choice($.identifier, $.number_literal)))
            )
        ),

        goto_statement: $ => seq(
            kw('goto'),
            field('label', choice($.identifier, $.number_literal))
        ),

        erase_statement: $ => seq(
            kw('erase'),
            $._lvalue,
            repeat(seq(',', $._lvalue))
        ),

        call_statement: $ => seq(
            kw('call'),
            choice(
                $.call_expression,
                $.member_expression,
                $.identifier
            )
        ),

        function_declaration: $ => seq(
            optional(field('access_modifier', choice(
                kw('public'),
                kw('private')
            ))),
            kw('function'),
            field('name', $.identifier),
            optional(seq(
                '(',
                field('parameters', optional($.parameter_list)),
                ')'
            )),
            $._terminator,
            repeat($.statement_line),
            kw('end'),
            kw('function')
        ),

        sub_declaration: $ => seq(
            optional(field('access_modifier', choice(
                kw('public'),
                kw('private')
            ))),
            kw('sub'),
            field('name', $.identifier),
            optional(seq(
                '(',
                field('parameters', optional($.parameter_list)),
                ')'
            )),
            $._terminator,
            repeat($.statement_line),
            kw('end'),
            kw('sub')
        ),

        parameter_list: $ => seq(
            $.parameter,
            repeat(seq(',', $.parameter))
        ),

        parameter: $ => seq(
            optional(field('optional', kw('optional'))),
            optional(field('mechanism', choice(
                kw('byval'),
                kw('byref')
            ))),
            field('name', $.identifier),
            optional(field('is_array', '()'))
        ),

        block_if_statement: $ => seq(
            kw('if'),
            field('condition', $._expression),
            kw('then'),
            $._terminator,
            repeat($.statement_line),
            repeat($.elseif_clause),
            optional($.else_clause),
            kw('end'),
            kw('if')
        ),

        single_line_if_statement: $ => prec.right(1, seq(
            kw('if'),
            field('condition', $._expression),
            kw('then'),
            field('consequence', $.statement_group),
            optional(seq(
                kw('else'),
                field('alternative', $.statement_group)
            ))
        )),

        elseif_clause: $ => seq(
            kw('elseif'),
            field('condition', $._expression),
            kw('then'),
            $._terminator,
            repeat($.statement_line)
        ),

        else_clause: $ => seq(
            kw('else'),
            $._terminator,
            repeat($.statement_line)
        ),

        for_statement: $ => seq(
            kw('for'),
            field('counter', $._lvalue),
            '=',
            field('start', $._expression),
            kw('to'),
            field('end', $._expression),
            optional(seq(
                kw('step'),
                field('step', $._expression)
            )),
            $._terminator,
            repeat($.statement_line),
            kw('next')
        ),

        for_each_statement: $ => seq(
            kw('for'),
            kw('each'),
            field('element', $._lvalue),
            kw('in'),
            field('group', $._expression),
            $._terminator,
            repeat($.statement_line),
            kw('next')
        ),

        do_loop_statement: $ => choice(
            // `Do ... Loop While/Until condition` has precedence to resolve ambiguity
            prec(1, seq(
                kw('do'),
                $._terminator,
                repeat($.statement_line),
                kw('loop'),
                field('loop_type', choice(kw('while'), kw('until'))),
                field('condition', $._expression)
            )),
            // `Do [While/Until condition] ... Loop`
            seq(
                kw('do'),
                optional(seq(
                    field('loop_type', choice(kw('while'), kw('until'))),
                    field('condition', $._expression)
                )),
                $._terminator,
                repeat($.statement_line),
                kw('loop')
            )
        ),

        while_wend_statement: $ => seq(
            kw('while'),
            field('condition', $._expression),
            $._terminator,
            repeat($.statement_line),
            kw('wend')
        ),

        exit_statement: $ => seq(
            kw('exit'),
            choice(
                kw('do'),
                kw('for'),
                kw('function'),
                kw('sub'),
                kw('property')
            )
        ),

        class_statement: $ => seq(
            optional(field('access_modifier', choice(
                kw('public'),
                kw('private')
            ))),
            kw('class'),
            field('name', $.identifier),
            $._terminator,
            repeat(seq($.class_statement_group, $._terminator)),
            kw('end'),
            kw('class')
        ),

        class_statement_group: $ => seq(
            $._class_statement,
            repeat(seq(':', $._class_statement))
        ),

        _class_statement: $ => choice(
            $.property_get_statement,
            $.property_let_statement,
            $.property_set_statement,
            $.function_declaration,
            $.sub_declaration,
            $.declaration_statement,
            $.rem_comment
        ),

        property_get_statement: $ => seq(
            optional(field('access_modifier', choice(
                kw('public'),
                kw('private')
            ))),
            optional(field('default', kw('default'))),
            kw('property'),
            kw('get'),
            field('name', $.identifier),
            optional(seq(
                '(',
                field('parameters', optional($.parameter_list)),
                ')'
            )),
            $._terminator,
            repeat($.statement_line),
            kw('end'),
            kw('property')
        ),

        property_let_statement: $ => seq(
            optional(field('access_modifier', choice(
                kw('public'),
                kw('private')
            ))),
            kw('property'),
            kw('let'),
            field('name', $.identifier),
            '(',
            field('parameters', $.parameter_list),
            ')',
            $._terminator,
            repeat($.statement_line),
            kw('end'),
            kw('property')
        ),

        property_set_statement: $ => seq(
            optional(field('access_modifier', choice(
                kw('public'),
                kw('private')
            ))),
            kw('property'),
            kw('set'),
            field('name', $.identifier),
            '(',
            field('parameters', $.parameter_list),
            ')',
            $._terminator,
            repeat($.statement_line),
            kw('end'),
            kw('property')
        ),

        select_case_statement: $ => seq(
            kw('select'), kw('case'),
            field('value', $._expression),
            $._terminator,
            repeat($.case_clause),
            optional($.case_else_clause),
            kw('end'), kw('select')
        ),

        case_clause: $ => seq(
            kw('case'),
            $.case_expression_list,
            $._terminator,
            repeat($.statement_line)
        ),

        case_else_clause: $ => seq(
            kw('case'), kw('else'),
            $._terminator,
            repeat($.statement_line)
        ),

        case_expression_list: $ => seq(
            $._case_expression,
            repeat(seq(',', $._case_expression))
        ),

        _case_expression: $ => choice(
            $._expression,
            alias(seq($._expression, kw('to'), $._expression), $.range_expression),
            alias(seq(kw('is'), field('operator', choice('=', '<>', '<', '<=', '>', '>=')), $._expression), $.is_expression)
        ),

        declaration_statement: $ => choice(
            $.variable_declaration,
            $.constant_declaration
        ),

        // `Public x` / `Private x` replace `Dim`; they are not combined with it
        // (VBScript Language Reference: Public, Private, Dim statements).
        variable_declaration: $ => seq(
            choice(
                field('access_modifier', choice(
                    kw('public'),
                    kw('private')
                )),
                field('keyword', choice(
                    kw('dim'),
                    seq(kw('redim'), optional(kw('preserve')))
                ))
            ),
            seq(
                $.declared_variable,
                repeat(seq(',', $.declared_variable))
            )
        ),

        declared_variable: $ => seq(
            field('name', $.identifier),
            optional(field('dimensions', seq(
                '(',
                optional($.argument_list),
                ')'
            )))
        ),

        constant_declaration: $ => seq(
            optional(field('access_modifier', choice(
                kw('public'),
                kw('private')
            ))),
            kw('const'),
            seq(
                $.constant_definition,
                repeat(seq(',', $.constant_definition))
            )
        ),

        constant_definition: $ => seq(
            field('name', $.identifier),
            '=',
            field('value', $._expression)
        ),

        set_statement: $ => seq(
            kw('set'),
            field('left', $._lvalue),
            '=',
            field('right', $._expression)
        ),


        _lvalue: $ => choice(
            $.identifier,
            $.member_expression,
            $.unqualified_member_expression,
            // For array/property setters
            $.call_expression
        ),

        // Assignment is a statement-level construct, not a sub-expression.
        // prec.dynamic(1) makes assignment win over expression_statement when
        // the input could be either `lvalue = expr` (assignment) or
        // `expr = expr` (comparison binary_expression).
        expression_statement: $ => choice(
            prec.dynamic(1, $.assignment_expression),
            $._expression
        ),

        _expression: $ => choice(
            $.unary_expression,
            $.binary_expression,
            $.parenthesized_expression,
            $.member_expression,
            $.call_expression,
            $._primary_expression
        ),

        assignment_expression: $ => prec.right('assignment', seq(
            optional(kw('let')),
            field('left', $._lvalue),
            '=',
            field('right', $._expression)
        )),

        implicit_call_statement: $ => prec(-1, seq(
            field('function', choice($.identifier, $.member_expression, $.unqualified_member_expression)),
            field('arguments', $.argument_list)
        )),

        _primary_expression: $ => choice(
            $.unqualified_member_expression,
            $.new_expression,
            $.identifier,
            $.string_literal,
            $.number_literal,
            $.hex_literal,
            $.octal_literal,
            $.date_literal,
            $.nothing,
            $.empty,
            $.null,
            $.boolean_literal
        ),

        new_expression: $ => seq(kw('new'), field('class', $.identifier)),

        parenthesized_expression: $ => seq('(', $._expression, ')'),

        unqualified_member_expression: $ => prec('member', seq(
            '.',
            field('property', $.identifier)
        )),

        member_expression: $ => prec.left('member', seq(
            field('object', $._expression),
            '.',
            field('property', $.identifier)
        )),

        call_expression: $ => prec.left('call', seq(
            field('function', $._expression),
            '(',
            field('arguments', optional($.argument_list)),
            ')'
        )),

        argument_list: $ => seq(
            $._expression,
            repeat(seq(',', $._expression))
        ),

        binary_expression: $ => choice(
            ...[
                [kw('or'), 'or'],
                [kw('xor'), 'xor'],
                [kw('and'), 'and'],
                [kw('imp'), 'imp'],
                [kw('eqv'), 'eqv'],
                ['&', 'concatenation'],
                ['+', 'addition'],
                ['-', 'addition'],
                ['*', 'multiplication'],
                ['/', 'multiplication'],
                ['\\', 'integer_division'],
                [kw('mod'), 'modulo'],
                ['^', 'exponent'],
                ['=', 'comparison'],
                ['<>', 'comparison'],
                ['<', 'comparison'],
                ['<=', 'comparison'],
                ['>', 'comparison'],
                ['>=', 'comparison'],
                [kw('is'), 'is'],
            ].map(([operator, precedence_name]) =>
                prec.left(precedence_name, seq(
                    field('left', $._expression),
                    field('operator', operator),
                    field('right', $._expression)
                ))
            )
        ),

        unary_expression: $ => choice(
          prec.right('unary', seq(
            field('operator', choice('+', '-')),
            field('operand', $._expression)
          )),
          prec.right('not', seq(
            field('operator', kw('not')),
            field('operand', $._expression)
          ))
        ),

        // Terminals
        _terminator: $ => choice('\r\n', '\n', '\r'),

        comment: $ => token(seq("'", /.*/)),

        rem_comment: $ => token(seq(ci('rem'), /[ \t].*/)),

        // The whitespace before `_` is consumed by the `/[ \t]/` extra. Starting
        // this token with a space would stop the lexer from skipping spaces,
        // so every token would include the whitespace before it.
        // Trade-off: `_` right after a non-space character (e.g. `a,_`) is also
        // accepted, although VBScript requires whitespace before it.
        line_continuation: $ => token(seq('_', choice('\r\n', '\n', '\r'))),

        identifier: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,

        // Content tokens are immediate so no extras (comments, whitespace) can be
        // lexed inside a string, and prec(1) lets content win over a longer
        // `'` comment match, e.g. in "'". Strings cannot span lines.
        string_literal: $ => seq(
            '"',
            repeat(choice(
                token.immediate(prec(1, /[^"\r\n]+/)),
                token.immediate('""')
            )),
            token.immediate('"')
        ),

        number_literal: $ => /(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/,

        hex_literal: $ => /&[hH][0-9a-fA-F]+/,

        octal_literal: $ => /&[oO][0-7]+/,

        // Date/time literals use # as delimiter; content is not validated.
        date_literal: $ => token(seq('#', /[^#\n\r]+/, '#')),

        // Use token(prec(1, ...)) to give keyword literals higher lexer priority
        // than the identifier rule (priority 0). This ensures True/False/Nothing/
        // Empty/Null are tokenized as their specific types rather than as identifiers.
        boolean_literal: $ => choice(
            token(prec(1, ci('true'))),
            token(prec(1, ci('false')))
        ),
        nothing: $ => token(prec(1, ci('nothing'))),
        empty: $ => token(prec(1, ci('empty'))),
        null: $ => token(prec(1, ci('null'))),
    }
});
