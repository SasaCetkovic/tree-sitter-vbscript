/**
 * @file VBScript grammar for the tree-sitter parsing library
 * @author Sasa Cetkovic <sasa.cetkovic@outlook.cz>
 * @license MIT
 */

 // Helper for creating case-insensitive keywords
 const ci = keyword => new RegExp(
   keyword.split('').map(c => `[${c.toLowerCase()}${c.toUpperCase()}]`).join('')
 );


/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
    name: 'vbscript',

    extras: $ => [
        $.comment,
        /[\s\t]/,
        $.line_continuation,
    ],

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
        // An expression that is also a valid l-value creates an ambiguity
        // when followed by an equals sign (assignment vs. comparison).
        [$._expression, $._lvalue],
        [$._primary_expression, $._lvalue],

        // An implicit call `foo bar` can be ambiguous with `foo` being an l-value
        [$.implicit_call_expression, $._lvalue],
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
            ci('option'),
            ci('explicit'),
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
        ),

        // Statements
        with_statement: $ => seq(
            ci('with'),
            field('object', $._expression),
            repeat($.statement_line),
            ci('end'),
            ci('with')
        ),

        on_error_statement: $ => seq(
            ci('on'),
            ci('error'),
            choice(
                seq(ci('resume'), ci('next')),
                seq(ci('goto'), field('label', choice($.identifier, $.number_literal)))
            )
        ),

        goto_statement: $ => seq(
            ci('goto'),
            field('label', choice($.identifier, $.number_literal))
        ),

        erase_statement: $ => seq(
            ci('erase'),
            $._lvalue,
            repeat(seq(',', $._lvalue))
        ),

        call_statement: $ => seq(
            ci('call'),
            choice(
                $.call_expression,
                seq(
                    field('function', choice($.identifier, $.member_expression)),
                    optional(field('arguments', $.argument_list))
                )
            )
        ),

        function_declaration: $ => seq(
            optional(field('access_modifier', choice(
                ci('public'),
                ci('private')
            ))),
            ci('function'),
            field('name', $.identifier),
            '(',
            field('parameters', optional($.parameter_list)),
            ')',
            repeat($.statement_line),
            ci('end'),
            ci('function')
        ),

        sub_declaration: $ => seq(
            optional(field('access_modifier', choice(
                ci('public'),
                ci('private')
            ))),
            ci('sub'),
            field('name', $.identifier),
            '(',
            field('parameters', optional($.parameter_list)),
            ')',
            repeat($.statement_line),
            ci('end'),
            ci('sub')
        ),

        parameter_list: $ => seq(
            $.parameter,
            repeat(seq(',', $.parameter))
        ),

        parameter: $ => seq(
            optional(field('optional', ci('optional'))),
            optional(field('mechanism', choice(
                ci('byval'),
                ci('byref')
            ))),
            field('name', $.identifier),
            optional(field('is_array', '()'))
        ),

        block_if_statement: $ => seq(
            ci('if'),
            field('condition', $._expression),
            ci('then'),
            $._terminator,
            repeat($.statement_line),
            repeat($.elseif_clause),
            optional($.else_clause),
            ci('end'),
            ci('if')
        ),

        single_line_if_statement: $ => prec.right(1, seq(
            ci('if'),
            field('condition', $._expression),
            ci('then'),
            field('consequence', $.statement_group),
            optional(seq(
                ci('else'),
                field('alternative', $.statement_group)
            ))
        )),

        elseif_clause: $ => seq(
            ci('elseif'),
            field('condition', $._expression),
            ci('then'),
            $._terminator,
            repeat($.statement_line)
        ),

        else_clause: $ => seq(
            ci('else'),
            $._terminator,
            repeat($.statement_line)
        ),

        for_statement: $ => seq(
            ci('for'),
            field('counter', $._lvalue),
            '=',
            field('start', $._expression),
            ci('to'),
            field('end', $._expression),
            optional(seq(
                ci('step'),
                field('step', $._expression)
            )),
            repeat($.statement_line),
            ci('next')
        ),

        for_each_statement: $ => seq(
            ci('for'),
            ci('each'),
            field('element', $._lvalue),
            ci('in'),
            field('group', $._expression),
            repeat($.statement_line),
            ci('next')
        ),

        do_loop_statement: $ => choice(
            // `Do ... Loop While/Until condition` has precedence to resolve ambiguity
            prec(1, seq(
                ci('do'),
                repeat($.statement_line),
                ci('loop'),
                field('loop_type', choice(ci('while'), ci('until'))),
                field('condition', $._expression)
            )),
            // `Do [While/Until condition] ... Loop`
            seq(
                ci('do'),
                optional(seq(
                    field('loop_type', choice(ci('while'), ci('until'))),
                    field('condition', $._expression)
                )),
                repeat($.statement_line),
                ci('loop')
            )
        ),

        while_wend_statement: $ => seq(
            ci('while'),
            field('condition', $._expression),
            repeat($.statement_line),
            ci('wend')
        ),

        exit_statement: $ => seq(
            ci('exit'),
            choice(
                ci('do'),
                ci('for'),
                ci('function'),
                ci('sub'),
                ci('property')
            )
        ),

        class_statement: $ => seq(
            optional(field('access_modifier', choice(
                ci('public'),
                ci('private')
            ))),
            ci('class'),
            field('name', $.identifier),
            $._terminator,
            repeat(seq($.class_statement_group, $._terminator)),
            ci('end'),
            ci('class')
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
                ci('public'),
                ci('private')
            ))),
            optional(field('default', ci('default'))),
            ci('property'),
            ci('get'),
            field('name', $.identifier),
            '(',
            field('parameters', optional($.parameter_list)),
            ')',
            repeat($.statement_line),
            ci('end'),
            ci('property')
        ),

        property_let_statement: $ => seq(
            optional(field('access_modifier', choice(
                ci('public'),
                ci('private')
            ))),
            ci('property'),
            ci('let'),
            field('name', $.identifier),
            '(',
            field('parameters', $.parameter_list),
            ')',
            repeat($.statement_line),
            ci('end'),
            ci('property')
        ),

        property_set_statement: $ => seq(
            optional(field('access_modifier', choice(
                ci('public'),
                ci('private')
            ))),
            ci('property'),
            ci('set'),
            field('name', $.identifier),
            '(',
            field('parameters', $.parameter_list),
            ')',
            repeat($.statement_line),
            ci('end'),
            ci('property')
        ),

        select_case_statement: $ => seq(
            ci('select'), ci('case'),
            field('value', $._expression),
            $._terminator,
            repeat($.case_clause),
            optional($.case_else_clause),
            ci('end'), ci('select')
        ),

        case_clause: $ => seq(
            ci('case'),
            $.case_expression_list,
            $._terminator,
            repeat($.statement_line)
        ),

        case_else_clause: $ => seq(
            ci('case'), ci('else'),
            $._terminator,
            repeat($.statement_line)
        ),

        case_expression_list: $ => seq(
            $._case_expression,
            repeat(seq(',', $._case_expression))
        ),

        _case_expression: $ => choice(
            $._expression,
            alias(seq($._expression, ci('to'), $._expression), $.range_expression),
            alias(seq(ci('is'), field('operator', choice('=', '<>', '<', '<=', '>', '>=')), $._expression), $.is_expression)
        ),

        declaration_statement: $ => choice(
            $.variable_declaration,
            $.constant_declaration
        ),

        variable_declaration: $ => seq(
            optional(field('access_modifier', choice(
                ci('public'),
                ci('private')
            ))),
            field('keyword', choice(
                ci('dim'),
                seq(ci('redim'), optional(ci('preserve')))
            )),
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
                ci('public'),
                ci('private')
            ))),
            ci('const'),
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
            ci('set'),
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

        expression_statement: $ => $._expression,

        _expression: $ => choice(
            $.assignment_expression,
            $.implicit_call_expression,
            $.unary_expression,
            $.binary_expression,
            $.parenthesized_expression,
            $.member_expression,
            $.call_expression,
            $._primary_expression
        ),

        assignment_expression: $ => prec.right('assignment', seq(
            optional(ci('let')),
            field('left', $._lvalue),
            '=',
            field('right', $._expression)
        )),

        implicit_call_expression: $ => prec(-1, seq(
            field('function', choice($.identifier, $.member_expression)),
            field('arguments', $.argument_list)
        )),

        _primary_expression: $ => choice(
            $.unqualified_member_expression,
            $.identifier,
            $.string_literal,
            $.number_literal,
            $.nothing,
            $.empty,
            $.null,
            $.boolean_literal
        ),

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
                [ci('or'), 'or'],
                [ci('xor'), 'xor'],
                [ci('and'), 'and'],
                [ci('imp'), 'imp'],
                [ci('eqv'), 'eqv'],
                ['&', 'concatenation'],
                ['+', 'addition'],
                ['-', 'addition'],
                ['*', 'multiplication'],
                ['/', 'multiplication'],
                ['\\', 'integer_division'],
                [ci('mod'), 'modulo'],
                ['^', 'exponent'],
                ['=', 'comparison'],
                ['<>', 'comparison'],
                ['<', 'comparison'],
                ['<=', 'comparison'],
                ['>', 'comparison'],
                ['>=', 'comparison'],
                [ci('is'), 'is'],
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
            field('operator', ci('not')),
            field('operand', $._expression)
          ))
        ),

        // Terminals
        _terminator: $ => choice('\r\n', '\n', '\r'),

        comment: $ => token(seq("'", /.*/)),

        rem_comment: $ => token(seq(ci('rem'), /.*/)),

        line_continuation: $ => token(' _'),

        identifier: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,

        string_literal: $ => seq('"', repeat(choice(/[^"]+/, '""')), '"'),

        number_literal: $ => /\d+(\.\d+)?/,

        boolean_literal: $ => choice(ci('true'), ci('false')),
        nothing: $ => ci('nothing'),
        empty: $ => ci('empty'),
        null: $ => ci('null'),
    }
});
