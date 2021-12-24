import {binaryOperatorParselet, nameParselet, Parser, prefixParselet, parenthesisParselet} from './Parser.js'
import {Lexer, TokenKind} from './Lexer.js'

// Working through http://journal.stuffwithstuff.com/2011/03/19/pratt-parsers-expression-parsing-made-easy/
let lexer = new Lexer();
let tokens = lexer.tokenize("a - (b - c)");
console.log(tokens);


const parser = new Parser(tokens);

parser.registerPrefixParselet(TokenKind.PLUS, prefixParselet);
parser.registerPrefixParselet(TokenKind.MINUS, prefixParselet);
parser.registerPrefixParselet(TokenKind.MULTIPLY, prefixParselet);
parser.registerPrefixParselet(TokenKind.DIVIDE, prefixParselet);
parser.registerPrefixParselet(TokenKind.LPAREN, parenthesisParselet);
parser.registerPrefixParselet(TokenKind.IDENTIFIER, nameParselet);
parser.registerPrefixParselet(TokenKind.NUMBER, nameParselet);

parser.registerInfixParselet(TokenKind.MINUS, binaryOperatorParselet, 1);
parser.registerInfixParselet(TokenKind.PLUS, binaryOperatorParselet, 2);
parser.registerInfixParselet(TokenKind.MULTIPLY, binaryOperatorParselet, 3);
parser.registerInfixParselet(TokenKind.DIVIDE, binaryOperatorParselet, 4);

let result = parser.parseExpression()
console.log(result)