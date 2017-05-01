/* Board Controller */

var pieces = require('./pieces.js');
var parser = require('./parser.js')
var Piece = pieces.Piece;

function Square(id){
  if(!(this instanceof Square))
    throw new Error("Square is a constructor, use it w/ new");

  this.id = id;
  this.piece = null;
}


function Board(){
  const WHITE = 1, BLACK = 0;
  this.wInCheck = false;
  this.bInCheck = false;
  this.moves = [];
  this.squares = (() => {
    let arr=[];
    for(let f='a'.charCodeAt(); f<='h'.charCodeAt(); f++)
      for(let r=1; r<=8; r++) {
        if(r==1) arr.push([]);
        arr[f-97].push( new Square(String.fromCharCode(f)+r.toString()) );
      }
  return arr;
  })();

  this.turn = -1;

  this.wPieces = [], this.bPieces = [];
  this.wGraveyard = [], this.bGraveyard = [];
  this.lastMovedPiece = null;
  this.lastCapturedPiece = null;
  this.lastMovedSpace = null;
};

Board.prototype.initBoard = function(){
  const WHITE = 1, BLACK = 0;

  this.wPieces.push(new Piece(WHITE, 'R', 'a1'));
  this.wPieces.push(new Piece(WHITE, 'R', 'h1'));
  this.wPieces.push(new Piece(WHITE, 'N', 'b1'));
  this.wPieces.push(new Piece(WHITE, 'N', 'g1'));
  this.wPieces.push(new Piece(WHITE, 'B', 'c1'));
  this.wPieces.push(new Piece(WHITE, 'B', 'f1'));
  this.wPieces.push(new Piece(WHITE, 'Q', 'd1'));
  this.wPieces.push(new Piece(WHITE, 'K', 'e1'));

  for(var i = 'a'.charCodeAt(); i <= 'h'.charCodeAt(); i++)
    this.wPieces.push(new Piece(WHITE, '', String.fromCharCode(i) + '2'));

  this.bPieces.push(new Piece(BLACK, 'R', 'a8'));
  this.bPieces.push(new Piece(BLACK, 'R', 'h8'));
  this.bPieces.push(new Piece(BLACK, 'N', 'b8'));
  this.bPieces.push(new Piece(BLACK, 'N', 'g8'));
  this.bPieces.push(new Piece(BLACK, 'B', 'c8'));
  this.bPieces.push(new Piece(BLACK, 'B', 'f8'));
  this.bPieces.push(new Piece(BLACK, 'Q', 'd8'));
  this.bPieces.push(new Piece(BLACK, 'K', 'e8'));

  for(var i = 'a'.charCodeAt(); i <= 'h'.charCodeAt(); i++)
    this.bPieces.push(new Piece(BLACK, '', String.fromCharCode(i) + '7'));

  this.wPieces.forEach((p) => { let sq = this.getSquare(p.location); sq.piece = p });
  this.bPieces.forEach((p) => { let sq = this.getSquare(p.location); sq.piece = p });

  this.turn = 1;
}

/* Support functions */
Board.prototype.boardState = function(){
  let wPieces = this.wPieces, bPieces = this.bPieces,
      wGraveyard = this.wGraveyard, bGraveyard = this.bGraveyard,
      lastMovedPiece = this.lastMovedPiece,
      lastMovedSpace = this.lastMovedSpace,
      lastCapturedPiece = this.lastCapturedPiece;
  return {
    wPieces: wPieces,
    bPieces: bPieces,
    wGraveyard: wGraveyard,
    bGraveyard: bGraveyard,
    lastMovedPiece: lastMovedPiece,
    lastMovedSpace: lastMovedSpace,
    lastCapturedPiece: lastCapturedPiece
  };
}

Board.prototype.isPopulated = function(sq){
  if(this.getSquare(sq).piece)
    return true;
  return false;
}

Board.prototype.isKingInCheck = function(side){
  let saidSide = (side) ? this.wPieces : this.bPieces,
      saidKing = saidSide.filter((p) => p.type == 'K')[0],
      saidKingSquare = this.getSquare(saidKing.location);
  let otherSide = (!side)? this.wPieces : this.bPieces;

  return otherSide.some((p) => this.hasPath(p, saidKingSquare, true), this);
}

Board.prototype.getSquare = function(sq){
  if( !(sq.match(/^[a-h][1-8]$/)) )
    throw new Error('Algebraic move parser error');
  let file, rank, col, row;
  file = sq[0];
  rank = sq[1];

  row = file.charCodeAt() - 97;
  col = parseInt(rank) - 1;

  return this.squares[row][col];
}

Board.prototype.getLastPiece = function(){
  return this.lastMovedPiece;
}

Board.prototype.getLastSpace = function(){
  return this.lastMovedSpace;
}

Board.prototype.move = function(move){

  let move_data = this.parseMove(move),
      piece_type = move_data[0],
      space = move_data[1],
      sq = this.getSquare(space),
      capture = move_data[2],
      etc = move_data[3];

  let pc = this.getPiece(move);

  if(!pc)
    throw new Error('Illegal move error on move: ' + move), console.log(pc);

  if(capture)
  {
      let otherSide = (pc.side)? this.bPieces : this.wPieces,
          otherGraveYard = (pc.side)? this.bGraveyard : this.wGraveyard;
      let capturedPiece = this.getSquare(space).piece;
      let index = otherSide.findIndex((p) => p.type == capturedPiece.type && p.location == capturedPiece.location);

      otherSide.splice(index,1);
      otherGraveYard.push(capturedPiece);
  }

  let oldSquare = this.getSquare(pc.location),
      newSquare = this.getSquare(space);

  this.lastMovedPiece = pc;
  this.lastMovedSpace = oldSquare;

  newSquare.piece = pc;
  oldSquare.piece = null;
  pc.location = space;
  pc.noMoves++;


  let kingInCheck = false;
  if(this.isKingInCheck(!this.turn))
    kingInCheck = true;

  if(!this.turn)
    this.wInCheck = kingInCheck;
  else
    this.bInCheck = kingInCheck;


  this.moves.push(move);
  this.turn = (this.turn)? 0:1;

}

Board.prototype.undo = function(){

  var pc = this.getLastPiece(),
      sq = this.getLastSpace();

  let move = this.moves.pop(),
      move_data = this.parseMove(move),
      piece_type = move_data[0],
      space = move_data[1],
      capture = move_data[2],
      etc = move_data[3];

  pc.location = sq.id;
  pc.noMoves--;

  sq.piece = pc;

  if(arguments.length && typeof arguments[0] == 'object')
    for(let prop in arguments[0])
      if(this.hasOwnProperty(prop))
        this[prop] = arguments[0][prop];

  this.turn = (this.turn)? 0:1;
}

Board.prototype.parseMove = parser.parseMove;

Board.prototype.getPiece = function(move){
  let move_data = this.parseMove(move),
      piece_type = move_data[0],
      sq = this.getSquare(move_data[1]),
      capture = move_data[2],
      etc = move_data[3];

  let pcs = this.getPieces(this.turn);

  if(etc)
    pcs = pcs.filter((p) => p.type == piece_type && p.location.includes(etc));
  else
    pcs = pcs.filter((p) => p.type == piece_type);

  pcs = pcs.filter((p) => this.hasPath(p, sq, capture));

  if(pcs.length > 1)
    throw new Error('Disambiguous move error');
  else if(pcs.length == 0)
    throw new Error('Illegal move error')

  return pcs[0];

}

Board.prototype.getPieces = function(side){
  return (side)? this.wPieces : this.bPieces;
}

Board.prototype.hasPath = function(pc, sq, capture=false){

  let squareId = sq.id;
  let nextFile = squareId[0].charCodeAt(), nextRank = parseInt(squareId[1]);
  let currFile = pc.location[0].charCodeAt(), currRank = parseInt(pc.location[1]);

  var isPath = false;

  switch(pc.type){
    case '':
      // Regular pawn advance
      if(currFile == nextFile && Math.abs(nextRank-currRank) == 1)
        isPath=true;
      // Regular pawn capture
      if(Math.abs(nextFile-currFile) == 1 && Math.abs(nextRank-currRank) == 1)
          if(capture)
            isPath=true;
      // Two square pawn opening
      if(pc.noMoves == 0 && currFile == nextFile && Math.abs(nextRank-currRank) == 2)
        isPath=true;
      break;

    case 'R':
      // Vertical advance
      if(currFile == nextFile){
        for(let i = currRank; (i < nextRank)? i < nextRank : i > nextRank; (i < nextRank)? i++ : i--)
          if( this.isPopulated(String.fromCharCode(currFile)+i.toString()) )
            isPath=false;
        isPath=true;
      }
      // Horizontal advance
      if(currRank == nextRank){
        for(let i = currFile; (i < nextFile)? i < nextFile : i > nextFile; (i < nextFile)? i++ : i--)
          if( this.isPopulated(String.fromCharCode(currFile)+i.toString()) )
            isPath=false;
        isPath=true;
      }

      break;

    case 'N':
      if(Math.abs(nextFile-currFile) == 2 && Math.abs(nextRank-currRank) == 1)
        isPath=true;

      else if(Math.abs(nextFile-currFile) == 1 && Math.abs(nextRank-currRank) == 2)
        isPath=true;

      else
        isPath=false;

      break;

    case 'B':
      // Diagonal advance
      let i, j;
      for(i = currRank, j = currFile;
        ((i < nextRank)? i < nextRank : i > nextRank) && ((j < nextFile)? j < nextFile : j > nextFile);
        ((i < nextRank)? i++ : i--), ((j < nextFile)? j++ : j--))
          if( this.isPopulated(String.fromCharCode(j)+i.toString()) && (i!=currRank && j!=currFile) )
            { isPath=false; break; }
      if(i == nextRank && j == nextFile) isPath=true;
      break;

    case 'Q':
      // Vertical advance
      if(currFile == nextFile){
        for(let i = currRank; (i < nextRank)? i < nextRank : i > nextRank; (i < nextRank)? i++ : i--)
          if( this.isPopulated(String.fromCharCode(currFile)+i.toString()) )
            isPath=false;
        isPath=true;
      }
      // Horizontal advance
      else if(currRank == nextRank){
        for(let i = currFile; (i < nextFile)? i < nextFile : i > nextFile; (i < nextFile)? i++ : i--)
          if( this.isPopulated(String.fromCharCode(currFile)+i.toString()) )
            isPath=false;
        isPath=true;
      }
      // Diagonal advance
      else {
        let i, j;
        for(i = currRank, j = currFile;
          ((i < nextRank)? i < nextRank : i > nextRank) && ((j < nextFile)? j < nextFile : j > nextFile);
          ((i < nextRank)? i++ : i--), ((j < nextFile)? j++ : j--))
            if( this.isPopulated(String.fromCharCode(j)+i.toString()) && (i!=currRank && j!=currFile) )
              { isPath=false; break; }
        if(i == nextRank && j == nextFile) isPath=true;
      }
      break;

    case 'K':
      if( Math.abs(nextFile - currFile) == 1 &&
      (Math.abs(nextRank - currRank) == 1 || Math.abs(nextRank - currRank) == 0) )
        isPath=true;
      if( Math.abs(nextRank - currRank) == 1 &&
      (Math.abs(nextFile - currFile) == 1 || Math.abs(nextFile - currFile) == 0) )
        isPath=true;
      break;

    default:
      isPath=false;
  }
  return isPath;
}

Board.prototype.isLegal = function(move){
  let move_data = this.parseMove(move),
      isLegal = true,
      isIllegal = false;

  let piece_type = move_data[0],
      space = move_data[1],
      capture = move_data[2],
      etc = move_data[3];

  /*
    Needs to check if space is occupied, in case of capture, by opposing team piece.

    Needs to check if piece can access square.

    Needs to check if moving side puts king in check.

  */

  // Get Piece
  let pcs, side = this.turn;

  // Check if square is available for move or capture.
  if(this.getSquare(space).piece){
    if(!capture)
      return isIllegal;
    else{
      let otherTeam = (side) ? this.bPieces : this.wPieces;
      let otherPiece = otherTeam.filter((p) => p.type != 'K' && p.location == space)[0];
      if(!otherPiece) return isIllegal;
    }
  }


  let boardState = this.boardState(),
      pc = this.getPiece(move);

  let noTotalMoves = this.moves.length;

  this.move(move);

  // Something went wrong
  if(noTotalMoves == this.moves.length)
    return isIllegal;

  // King is in Check
  if((side)? this.wInCheck : this.bInCheck){
    this.undo(boardState);
    return isIllegal;
  }

  else{
    this.undo(boardState);
    return isLegal;
  }

}

module.exports = {
  Board: Board
}
