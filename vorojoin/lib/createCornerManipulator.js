module.exports = createCornerManipulator;

function createCornerManipulator(matrix) {
  let workingSet = {
    perspective: -1,
    squareCase: 0,
    row: -1,
    column: -1,
  }

  return {
    forEachPolygon
  }

  function forEachPolygon(row, column, visitor) {
    let topLeftCase = getCase(row, column, matrix[row][column]);
    handleCase(topLeftCase, visitor);

    let bottomLeftCase = getCase(row, column, matrix[row + 1][column]);
    handleCase(bottomLeftCase, visitor);

    let bottomRightCase = getCase(row, column, matrix[row + 1][column + 1]);
    handleCase(bottomRightCase, visitor);

    let topRightCase = getCase(row, column, matrix[row][column + 1]);
    handleCase(topRightCase, visitor);
  }

  function handleCase(caseToHandle, visitor) {
    switch (caseToHandle.squareCase) {
      case 0: {
        return; // nothing here
      }
      case 1: {
        visitor(caseToHandle.perspective, 
          [caseToHandle.row + 0.5, caseToHandle.column + 0.0],
          [caseToHandle.row + 1.0, caseToHandle.column + 0.5]
        )
        return;
      }
      case 2: {
        visitor(caseToHandle.perspective, 
          [caseToHandle.row + 1.0, caseToHandle.column + 0.5],
          [caseToHandle.row + 0.5, caseToHandle.column + 1.0],
        )
        return;
      }
      case 3: {
        visitor(caseToHandle.perspective, 
          [caseToHandle.row + 0.5, caseToHandle.column + 0.0],
          [caseToHandle.row + 0.5, caseToHandle.column + 1.0],
        )
        return;
      }
      case 4: {
        visitor(caseToHandle.perspective, 
          [caseToHandle.row + 0.0, caseToHandle.column + 0.5],
          [caseToHandle.row + 0.5, caseToHandle.column + 1.0],
        )
        return;
      }
      case 5: {
        visitor(caseToHandle.perspective, 
          [caseToHandle.row + 0.5, caseToHandle.column + 0.0],
          [caseToHandle.row + 0.0, caseToHandle.column + 0.5],
        );
        visitor(caseToHandle.perspective, 
          [caseToHandle.row + 1.0, caseToHandle.column + 0.5],
          [caseToHandle.row + 0.5, caseToHandle.column + 1.0],
        )
        return;
      }
      case 6: {
        visitor(caseToHandle.perspective, 
          [caseToHandle.row + 0.0, caseToHandle.column + 0.5],
          [caseToHandle.row + 1.0, caseToHandle.column + 0.5],
        )
        return;
      }
      case 7: {
        visitor(caseToHandle.perspective, 
          [caseToHandle.row + 0.5, caseToHandle.column + 0.0],
          [caseToHandle.row + 0.0, caseToHandle.column + 0.5],
        )
        return;
      }
      case 8: {
        visitor(caseToHandle.perspective, 
          [caseToHandle.row + 0.5, caseToHandle.column + 0.0],
          [caseToHandle.row + 0.0, caseToHandle.column + 0.5],
        )
        return;
      }
      case 9: {
        visitor(caseToHandle.perspective, 
          [caseToHandle.row + 0.0, caseToHandle.column + 0.5],
          [caseToHandle.row + 1.0, caseToHandle.column + 0.5],
        )
        return;
      }
      case 10: {
        visitor(caseToHandle.perspective, 
          [caseToHandle.row + 0.0, caseToHandle.column + 0.5],
          [caseToHandle.row + 0.5, caseToHandle.column + 1.0],
        )
        visitor(caseToHandle.perspective, 
          [caseToHandle.row + 0.5, caseToHandle.column + 0.0],
          [caseToHandle.row + 1.0, caseToHandle.column + 0.5],
        )
        return;
      }
      case 11: {
        visitor(caseToHandle.perspective, 
          [caseToHandle.row + 0.0, caseToHandle.column + 0.5],
          [caseToHandle.row + 0.5, caseToHandle.column + 1.0],
        )
        return;
      }
      case 12: {
        visitor(caseToHandle.perspective, 
          [caseToHandle.row + 0.5, caseToHandle.column + 0.0],
          [caseToHandle.row + 0.5, caseToHandle.column + 1.0],
        )
        return;
      }
      case 13: {
        visitor(caseToHandle.perspective, 
          [caseToHandle.row + 1.0, caseToHandle.column + 0.5],
          [caseToHandle.row + 0.5, caseToHandle.column + 1.0],
        )
        return;
      }
      case 14: {
        visitor(caseToHandle.perspective, 
          [caseToHandle.row + 0.5, caseToHandle.column + 0.0],
          [caseToHandle.row + 1.0, caseToHandle.column + 0.5],
        )
        return;
      }
      case 15: {
        return;
      }
    }
  }

  function getCase(row, column, perspective) {
    // https://en.wikipedia.org/wiki/Marching_squares
    let squareCase = 0;

    if (matrix[row + 1][column + 0] !== perspective) squareCase = (squareCase | 0b0001);
    if (matrix[row + 1][column + 1] !== perspective) squareCase = (squareCase | 0b0010);
    if (matrix[row + 0][column + 1] !== perspective) squareCase = (squareCase | 0b0100);
    if (matrix[row + 0][column + 0] !== perspective) squareCase = (squareCase | 0b1000);

    workingSet.perspective = perspective
    workingSet.squareCase = squareCase;
    workingSet.row = row;
    workingSet.column = column;

    return workingSet;
  }
}