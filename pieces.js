var PieceType = {
  Pawn: '',
  Knight: 'N',
  Bishop: 'B',
  Rook: 'R',
  Queen: 'Q',
  King: 'K'
};

function Piece(side, type, position){
  if(!(this instanceof Piece))
    throw new Error("Piece is a constructor, use it w/ new");

  this.side = side;
  this.type = type;

  this.location = position;
  this.noMoves = 0;

};

module.exports = {
  PieceType: PieceType,
  Piece: Piece
}
