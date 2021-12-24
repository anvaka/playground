import {BinaryOperatorParselet, NameParselet, Parser, PrefixOperatorParselet, ParenthesisParselet} from './Parser.js'
import {Lexer, TokenKind} from './Lexer.js'

// Working through http://journal.stuffwithstuff.com/2011/03/19/pratt-parsers-expression-parsing-made-easy/
let lexer = new Lexer();
let tokens = lexer.tokenize("a - (b - c)");
console.log(tokens);


const parser = new Parser(tokens);

const prefixParselet = new PrefixOperatorParselet();
parser.registerPrefixParselet(TokenKind.PLUS, prefixParselet);
parser.registerPrefixParselet(TokenKind.MINUS, prefixParselet);
parser.registerPrefixParselet(TokenKind.MULTIPLY, prefixParselet);
parser.registerPrefixParselet(TokenKind.DIVIDE, prefixParselet);
parser.registerPrefixParselet(TokenKind.LPAREN, new ParenthesisParselet());
parser.registerPrefixParselet(TokenKind.IDENTIFIER, new NameParselet());
parser.registerPrefixParselet(TokenKind.NUMBER, new NameParselet());

parser.registerInfixParselet(TokenKind.MINUS, new BinaryOperatorParselet(1))
parser.registerInfixParselet(TokenKind.PLUS, new BinaryOperatorParselet(2))
parser.registerInfixParselet(TokenKind.MULTIPLY, new BinaryOperatorParselet(3))
parser.registerInfixParselet(TokenKind.DIVIDE, new BinaryOperatorParselet(4))

let result = parser.parseExpression()
console.log(result)