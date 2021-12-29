// collection of all the expressions
export class NameExpression {
  constructor(value) { this.value = value; }
  evaluate(scope) { return scope.get(this.value); }
  collectNames(store) { store.add(this.value); }
}

export class FunctionCallExpression {
  constructor(name, args) {
    this.name = name.value;
    this.args = args;
  }

  evaluate(scope) {
    let argVal = this.args.map(x => x.evaluate(scope));
    switch (this.name) {
      case 'sin': return argVal[0].map(x => Math.sin(x));
      case 'cos': return argVal[0].map(x => Math.cos(x));
    }
    throw new Error('Not implemented');
  }
  collectNames(store) { this.args.forEach(x => x.collectNames(store)); }
}

export class BinaryExpression {
  constructor(left, operator, right) {
    this.left = left;
    this.operator = operator;
    this.right = right;
  }

  collectNames(store) {
    this.left.collectNames(store);
    this.right.collectNames(store);
  }

  evaluate(scope) {
    let leftValue = this.left.evaluate(scope);
    let rightValue = this.right.evaluate(scope);
    if (leftValue.length !== rightValue.length) {
      throw new Error("Can't evaluate vectors of different lengths");
    }
    switch (this.operator) {
      case '+': return add(leftValue, rightValue);
      case '-': return sub(leftValue, rightValue);
      case '*': return mul(leftValue, rightValue);
      case '/': return div(leftValue, rightValue);
    }
    throw new Error("Unknown operator: " + this.operator);
  }
}

export class PrefixExpression {
  constructor(operator, right) {
    this.operator = operator;
    this.right = right;
  }
  collectNames(store) {
    this.right.collectNames(store);
  }
  evaluate(scope) {
    let sign = (this.operator === '-' ? -1 : 1)
    return this.right.evaluate(scope).map(x => x * sign);
  }
}

function add(left, right) {
  return left.map((x, i) => x + right[i]);
}
function sub(left, right) {
  return left.map((x, i) => x - right[i]);
}
function mul(left, right) {
  return left.map((x, i) => x * right[i]);
}
function div(left, right) {
  return left.map((x, i) => x / right[i]);
}