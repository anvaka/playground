export const TokenKind = {
  NUMBER: 0,
  MULTIPLY: 1,
  PLUS: 2,
  MINUS: 3,
  DIVIDE: 4,
  IDENTIFIER: 5,
  LPAREN: 6,
  RPAREN: 7,
  COMMA: 8,
}

const Operators = new Map([
  ["+", TokenKind.PLUS],
  ["-", TokenKind.MINUS],
  ["*", TokenKind.MULTIPLY],
  ["/", TokenKind.DIVIDE],
  [",", TokenKind.COMMA],
])

const tokensRegex = new RegExp(
  "(" +
    "[1-9][0-9]*|"    + // Numbers
    "[\(\)]|"         + // Parenthesis
    "[+\\-*/,]|"      + // operators
    "[ \\t\\r\\n]|"   + // Whitespace
    "[A-Za-z_][A-Z-a-z_0-9_]*" + // Identifiers
  ")")

export class Lexer {
  tokenize(text) {
    let tokens = [];
    text.split(tokensRegex).forEach((value, index) => {
      if (index % 2 === 0 && value !== "") {
        throw new Error(`Invalid input ${text}`);
      } else if (index % 2 != 0) {
        let c = value[0];
        if (c >= 'A' && c <= 'Z' || c >= 'a' && c <= 'z' || c == '_') {
          // identifier
          tokens.push({ kind: TokenKind.IDENTIFIER, value });
        } else if (c >= '0' && c <= '9') {
          // number
          tokens.push({kind: TokenKind.NUMBER, value });
        } else if (Operators.has(value)) {
          // operator
          tokens.push({kind: Operators.get(value), value });
        } else if (c === '(' || c === ')') {
          tokens.push({kind: c === '(' ? TokenKind.LPAREN : TokenKind.RPAREN, value });
        } else {
          // whitespace?
        }
      }
    });

    return tokens;
  }
}
