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
        [
            'member',
            'call',
            $._primary_expression,
        ],
        [
            'unary',
            'exponent',
            'multiplication',
            'integer_division',
            'modulo',
            'addition',
            'concatenation',
            'comparison',
            'is',
            'not',
            'and',
            'or',
            'xor',
            'eqv',
            'imp'
        ]
    ],

    supertypes: $ => [
        $._statement,
        $._expression,
        $._class_statement,
    ],

    rules: {
        source_file: $ => repeat($._statement_line),

        _statement_group: $ => prec.left(seq(
            $._statement,
            repeat(seq(':', $._statement))
        )),

        _statement_line: $ => seq(
            $._statement_group,
            $._terminator
        ),

        _statement: $ => choice(
            $.rem_comment, // REM is a statement, not an extra
            $.block_if_statement,
            $.single_line_if_statement,
            $.select_case_statement,
            $.for_statement,
            $.for_each_statement,
            $.do_loop_statement,
            $.while_wend_statement,
            $.exit_statement,
            $.declaration_statement,
            $.class_statement,
            $.function_declaration,
            $.sub_declaration,
            $.set_statement,
            $.assignment_statement,
            $.expression_statement,
            $.implicit_call_statement,
        ),

        // Statements
        function_declaration: $ => seq(
            optional(field('access_modifier', choice(
                ci('public'),
                ci('private')
            ))),
            ci('function'),
            field('name', $.identifier),
            '(',
            field('parameters', optional($._parameter_list)),
            ')',
            repeat($._statement_line),
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
            field('parameters', optional($._parameter_list)),
            ')',
            repeat($._statement_line),
            ci('end'),
            ci('sub')
        ),

        _parameter_list: $ => seq(
            $.parameter,
            repeat(seq(',', $.parameter))
        ),

        parameter: $ => seq(
            // NOTE: Optional is not supported, but leaving here as a reminder
            // optional(field('optional', ci('optional'))),
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
            repeat($._statement_line),
            repeat($.elseif_clause),
            optional($.else_clause),
            ci('end'),
            ci('if')
        ),

        single_line_if_statement: $ => prec.right(1, seq(
            ci('if'),
            field('condition', $._expression),
            ci('then'),
            field('consequence', $._statement_group),
            optional(seq(
                ci('else'),
                field('alternative', $._statement_group)
            ))
        )),

        elseif_clause: $ => seq(
            ci('elseif'),
            field('condition', $._expression),
            ci('then'),
            $._terminator,
            repeat($._statement_line)
        ),

        else_clause: $ => seq(
            ci('else'),
            $._terminator,
            repeat($._statement_line)
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
            repeat($._statement_line),
            ci('next')
        ),

        for_each_statement: $ => seq(
            ci('for'),
            ci('each'),
            field('element', $._lvalue),
            ci('in'),
            field('group', $._expression),
            repeat($._statement_line),
            ci('next')
        ),

        do_loop_statement: $ => choice(
            // `Do ... Loop While/Until condition` has precedence to resolve ambiguity
            prec(1, seq(
                ci('do'),
                repeat($._statement_line),
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
                repeat($._statement_line),
                ci('loop')
            )
        ),

        while_wend_statement: $ => seq(
            ci('while'),
            field('condition', $._expression),
            repeat($._statement_line),
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
            repeat(seq($._class_statement_group, $._terminator)),
            ci('end'),
            ci('class')
        ),

        _class_statement_group: $ => seq(
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
            field('parameters', optional($._parameter_list)),
            ')',
            repeat($._statement_line),
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
            field('parameters', $._parameter_list),
            ')',
            repeat($._statement_line),
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
            field('parameters', $._parameter_list),
            ')',
            repeat($._statement_line),
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
            $._case_expression_list,
            $._terminator,
            repeat($._statement_line)
        ),

        case_else_clause: $ => seq(
            ci('case'), ci('else'),
            $._terminator,
            repeat($._statement_line)
        ),

        _case_expression_list: $ => seq(
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
                optional($._argument_list),
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

        assignment_statement: $ => seq(
            optional(ci('let')),
            field('left', $._lvalue),
            '=',
            field('right', $._expression)
        ),

        _lvalue: $ => choice(
            $.identifier,
            $.member_expression,
            // For array/property setters
            $.call_expression
        ),

        expression_statement: $ => $.call_expression,

        implicit_call_statement: $ => prec(-1, seq(
            field('function', choice($.identifier, $.member_expression)),
            field('arguments', $._argument_list)
        )),

        _expression: $ => choice(
            $.unary_expression,
            $.binary_expression,
            $.parenthesized_expression,
            $._primary_expression,
        ),

        _primary_expression: $ => choice(
            $.member_expression,
            $.call_expression,
            $.identifier,
            $.string_literal,
            $.number_literal,
            $.nothing,
            $.empty,
            $.null,
            $.boolean_literal
        ),

        parenthesized_expression: $ => seq('(', $._expression, ')'),

        member_expression: $ => prec('member', seq(
            field('object', $._primary_expression),
            '.',
            field('property', $.identifier)
        )),

        call_expression: $ => prec('call', seq(
            field('function', $._primary_expression),
            '(',
            field('arguments', optional($._argument_list)),
            ')'
        )),

        _argument_list: $ => seq(
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
