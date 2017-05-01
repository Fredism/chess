/* Algebraic Move Parser */
function parseMove(move){
  let piece, space, capture = false, etc;

  // Pawn shorthand
  if(move.length == 2){
    piece = '';
    space = move;
  }

  // Castling
  else if(move == '0-0' || move == '0-0-0'){
    etc = move;
  }

  // Simple capture w/ any piece and move non pawns
  else if(move.length == 3 || (move.length == 4 && move.includes('x')) ){
    if(move.indexOf('x') !== -1){
      let parts = move.split('x');
      capture = true;

      // Simple capture by pawn
      if(parts[0] == ''){
        piece = parts[0];
        space = parts[1];
      }

      // Capture by a disambiguous pawn, check if the first part matches a file
      else if(parts[0].match(/[a-h]/)){
        peice = '';
        etc = parts[0];
        space = parts[1];
      }

      else
        throw new Error('Algebraic move parser error');

      return [piece, space, capture, etc];
    }

    piece = move[0];
    space = move.slice(1,3);
  }

  // Ambiguity collisions
  else if(move.length >= 4 || move.length <= 6){
    if( !(move[0].match(/N|B|R|K|Q/)) )
      throw new Error('Algebraic move parser error');
        piece = move[0];

    // Disambigous non pawn move, no capture
    if(!(move.includes('x'))){
      let parts = move.match(/[a-h]?[1-8]?/g);
      if( !(parts[1].match(/[a-h][1-8]|[a-h]|[1-8]/)) || !(parts[2].match(/[a-h]\d/)) )
        throw new Error('Algebraic move parser error');
      space = parts[2];
      etc = parts[1];
    }

    else{
      let parts = move.match(/[a-h]?[1-8]?/g);
      if( !(parts[1].match(/[a-h][1-8]|[a-h]|[1-8]/)) || !(parts[3].match(/[a-h][1-8]/)) )
        throw new Error('Algebraic move parser error');
      capture = true;
      space = parts[3];
      etc = parts[1];
    }

    return [piece, space, capture, etc];
  }

  else
    throw new Error('Algebraic move parser error');

  return [piece, space, capture];
}

module.exports = {
  parseMove: parseMove
}
