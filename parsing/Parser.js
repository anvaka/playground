import {TokenKind} from './Lexer.js';

export class Parser {
  constructor(tokens) {
    this.prefixParselets = new Map();
    this.infixParselets = new Map();

    this.tokens = tokens;
    this.current = 0;
  }

  parseExpression(precedence) {
    if (precedence === undefined) precedence = 0;
    let token = this.consume();
    let prefixParselet = this.prefixParselets.get(token.kind);
    if (!prefixParselet) {
      throw new Error(`No prefix parselet for ${token.kind}`);
    }
    
    let left = prefixParselet.parse(this, token);

    while (precedence < this.getPrecedence() && this.peek()) {
      token = this.consume();
      let infix = this.infixParselets.get(token.kind);
      left = infix.parse(this, left, token);
    }

    return left;
  }

  getPrecedence() {
    let token = this.peek();
    if (!token) return 0;
    let infix = this.infixParselets.get(token.kind);
    return infix ? infix.getPrecedence() : 0;
  }

  consume(expectedKind) {
    if (this.current >= this.tokens.length) {
      throw new Error("Unexpected end of input");
    }
    let currentToken = this.tokens[this.current++];
    if (expectedKind !== undefined && currentToken.kind !== expectedKind){
      throw new Error(`Expected token kind ${expectedKind}, got ${currentToken.kind}`);
    }

    return currentToken;
  }

  peek() {
    if (this.current >= this.tokens.length) return null;
    return this.tokens[this.current];
  }

  registerPrefixParselet(tokenKind, prefixParselet) {
    if (this.prefixParselets.has(tokenKind)) {
      throw new Error(`Prefix parselet already registered for token kind ${tokenKind}`);
    }

    this.prefixParselets.set(tokenKind, prefixParselet);
  }

  registerInfixParselet(tokenKind, infixParselet) {
    if (this.infixParselets.has(tokenKind)) {
      throw new Error(`Infix parselet already registered for token kind ${tokenKind}`);
    }
    this.infixParselets.set(tokenKind, infixParselet);
  }
}

export class Expression {}

export class NameExpression extends Expression {
  constructor(value) {
    super()
    this.value = value;
  }
}

export class BinaryExpression extends Expression {
  constructor(left, operator, right) {
    super();
    this.left = left;
    this.operator = operator;
    this.right = right;
  }
}

export class PrefixExpression extends Expression {
  constructor(operator, right) {
    super();
    this.operator = operator;
    this.right = right;
  }
}

// Prefix parsing
export class PrefixParselet {
  parse(parser, token) { throw new Error('Not implemented'); }
}

export class NameParselet extends PrefixParselet {
  constructor() { super(); }

  parse(parser, token) {
    return new NameExpression(token.value);
  }
}

export class ParenthesisParselet extends PrefixParselet {
  constructor() { super(); }

  parse(parser, token) {
    let expression = parser.parseExpression();
    parser.consume(TokenKind.RPAREN);
    return expression;
  }
}

export class PrefixOperatorParselet extends PrefixParselet {
  parse(parser, token) {
    let operand = parser.parseExpression();
    return new PrefixExpression(token.value, operand);
  }
}

// Infix parsing
export class InfixParselet {
  parse(parser, left, token) { throw new Error('Not implemented'); }
  getPrecedence() { throw new Error('Not implemented'); }
}

export class BinaryOperatorParselet  extends InfixParselet {
  constructor(precedence) { 
    super(); 
    this.precedence = precedence;
  }

  parse(parser, left, token) {
    return new BinaryExpression(left, token.value, parser.parseExpression(this.getPrecedence()));
  }

  getPrecedence() { return this.precedence; }
}