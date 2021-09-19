import {test} from 'tap';
import GameBoard from '../src/GameBoard.js'

test('it can find winner in 3x3', t => {
  for (let i = 0; i < 3; ++i) {
    let board = new GameBoard(3, 3, 3, []);
    board.play(i, 0, 'X'); 
    board.play(i, 1, 'X');
    board.play(i, 2, 'X');
    let winner = board.getWinner();
    
    t.equal(winner.symbol, 'X');
    t.same(winner.sequence, [[i, 0], [i, 1], [i, 2]]);
  }
  for (let i = 0; i < 3; ++i) {
    let board = new GameBoard(3, 3, 3, []);
    board.play(0, i, 'X'); board.play(1, i, 'X'); board.play(2, i, 'X');
    let winner = board.getWinner();
    
    t.equal(winner.symbol, 'X');
    t.same(winner.sequence, [[0, i], [1, i], [2, i]]);
  }

  { // Left diagonal check
    let board = new GameBoard(3, 3, 3, []);
    board.play(0, 0, 'X'); 
    board.play(1, 1, 'X'); 
    board.play(2, 2, 'X');
    let winner = board.getWinner();
    t.equal(winner.symbol, 'X');
    t.same(winner.sequence, [[0, 0], [1, 1], [2, 2]]);
  }
  { // Right diagonal check
    let board = new GameBoard(3, 3, 3, []);
    board.play(0, 2, 'X'); 
    board.play(1, 1, 'X'); 
    board.play(2, 0, 'X');
    let winner = board.getWinner();
    t.equal(winner.symbol, 'X');
    t.same(winner.sequence, [[0, 2], [1, 1], [2, 0]]);
  }
  t.end();
})

test('it can find winner in 100x100', t => {
  let board = new GameBoard(100, 100, 5, []);
  for (let i = 0; i < 5; ++i) {
    board.play(50 + i, i, 'X');
  }
  let winner = board.getWinner();
  
  t.equal(winner.symbol, 'X');
  t.same(winner.sequence, [[50, 0], [51, 1], [52, 2], [53, 3], [54, 4]]);
  t.end();
})