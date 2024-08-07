import {TokenKind} from './Lexer.js';
import { NameExpression, BinaryExpression, PrefixExpression, FunctionCallExpression} from './expressions.js';

export class Parser {
  constructor(tokens) {
    this.prefixParselets = new Map();
    this.infixParselets = new Map();
    this.precedenceMap = new Map();

    this.tokens = tokens || [];
    this.current = 0;
  }

  parse(tokens) {
    this.tokens = tokens;
    this.current = 0;
    const result = this.parseExpression()
    if (!this.isDone()) {
      throw new Error('UNEXPECTED TOKEN: ' + this.peek().value);
    }
    return result;
  }

  parseExpression(parselet) {
    let precedence = this.precedenceMap.get(parselet) || 0;
    let token = this.consume();
    let prefixParselet = this.prefixParselets.get(token.kind);
    if (!prefixParselet) {
      throw new Error(`No prefix parselet for ${token.kind}`);
    }
    
    let left = prefixParselet(this, token);

    while (precedence < this.getPrecedence() && this.peek()) {
      token = this.consume();
      let infixParselet = this.infixParselets.get(token.kind);
      left = infixParselet(this, token, left);
    }

    return left;
  }

  getPrecedence() {
    let token = this.peek();
    if (!token) return 0;
    return this.precedenceMap.get(this.infixParselets.get(token.kind)) || 0;
  }

  consume(expectedKind) {
    if (this.isDone()) { throw new Error("Unexpected end of input"); }

    let currentToken = this.tokens[this.current++];
    if (expectedKind !== undefined && currentToken.kind !== expectedKind){
      throw new Error(`Expected token kind ${expectedKind}, got ${currentToken.kind}`);
    }

    return currentToken;
  }

  peek() { return this.tokens[this.current] || null; }
  isDone() { return this.current >= this.tokens.length; }

  registerPrefixParselet(tokenKind, prefixParselet) {
    if (this.prefixParselets.has(tokenKind)) {
      throw new Error(`Prefix parselet already registered for token kind ${tokenKind}`);
    }

    this.prefixParselets.set(tokenKind, prefixParselet);
  }

  registerInfixParselet(tokenKind, infixParselet, priority) {
    if (this.infixParselets.has(tokenKind)) {
      throw new Error(`Infix parselet already registered for token kind ${tokenKind}`);
    }
    this.infixParselets.set(tokenKind, infixParselet);
    this.precedenceMap.set(infixParselet, priority || 0);
  }
}

// Prefix parsing
export function nameParselet(parser, token) { 
  return new NameExpression(token.value);
}

export function parenthesisParselet(parser, token) {
  let expression = parser.parseExpression();
  parser.consume(TokenKind.RPAREN);
  return expression;
}

export function prefixParselet(parser, token) {
  let operand = parser.parseExpression();
  return new PrefixExpression(token.value, operand);
}

// Infix parsing
export function binaryOperatorParselet(parser, token, left) {
  return new BinaryExpression(left, token.value, parser.parseExpression(binaryOperatorParselet));
}

export function functionParselet(parser, token, left) {
  let args = parser.parseExpression(functionParselet);
  parser.consume(TokenKind.RPAREN);
  return new FunctionCallExpression(left, args);
}