import {
  binaryOperatorParselet, 
  nameParselet, Parser, prefixParselet, parenthesisParselet,
  functionParselet} from './parsing/Parser.js'
import {Lexer, TokenKind} from './parsing/Lexer.js'

const lexer = new Lexer();
const parser = new Parser();

parser.registerPrefixParselet(TokenKind.PLUS, prefixParselet);
parser.registerPrefixParselet(TokenKind.MINUS, prefixParselet);
parser.registerPrefixParselet(TokenKind.MULTIPLY, prefixParselet);
parser.registerPrefixParselet(TokenKind.DIVIDE, prefixParselet);
parser.registerPrefixParselet(TokenKind.LPAREN, parenthesisParselet);
parser.registerPrefixParselet(TokenKind.IDENTIFIER, nameParselet);

parser.registerInfixParselet(TokenKind.MINUS, binaryOperatorParselet, 1);
parser.registerInfixParselet(TokenKind.PLUS, binaryOperatorParselet, 2);
parser.registerInfixParselet(TokenKind.MULTIPLY, binaryOperatorParselet, 3);
parser.registerInfixParselet(TokenKind.DIVIDE, binaryOperatorParselet, 4);
parser.registerInfixParselet(TokenKind.LPAREN, functionParselet, 5);

export default function createExpressionParser(expression) {
  const tokens = lexer.tokenize(expression);
  return parser.parse(tokens);
}