// collection of all the expressions
export class NameExpression {
  constructor(value) { this.value = value; }
  evaluate(scope) { return scope.get(this.value); }
}

export class BinaryExpression {
  constructor(left, operator, right) {
    this.left = left;
    this.operator = operator;
    this.right = right;
  }
  evaluate(scope) {
    let leftValue = this.left.evaluate(scope);
    let rightValue = this.right.evaluate(scope);
    switch (this.operator) {
      case '+': return leftValue + rightValue;
      case '-': return leftValue - rightValue;
      case '*': return leftValue * rightValue;
      case '/': return leftValue / rightValue;
      case '%': return leftValue % rightValue;
    }
    throw new Error("Unknown operator: " + this.operator);
  }
}

export class PrefixExpression {
  constructor(operator, right) {
    this.operator = operator;
    this.right = right;
  }
  evaluate(scope) {
    return (this.operator === '-' ? -1 : 1) * this.right.evaluate(scope);
  }
}