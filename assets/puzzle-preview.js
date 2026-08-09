(() => {
  const shell = document.querySelector('[data-puzzle-preview]');
  const boardElement = document.querySelector('[data-puzzle-board]');
  if (!shell || !boardElement) return;

  const projectUrl = 'https://kfdngvttwavrydtstwgq.supabase.co';
  const publishableKey = 'sb_publishable__p8irMwilwwAIE8qH0kQfA_h8NLRtJb';
  const segments = window.location.pathname.split('/').filter(Boolean);
  const pathIdentifier = segments[0] === 'puzzle'
    ? (segments[1] === 'en' ? segments[2] : segments[1])
    : null;
  const identifier = pathIdentifier || new URLSearchParams(window.location.search).get('id');

  const pieceFiles = {
    P: 'wP.svg', N: 'wN.svg', B: 'wB.svg', R: 'wR.svg', Q: 'wQ.svg', K: 'wK.svg',
    p: 'bP.svg', n: 'bN.svg', b: 'bB.svg', r: 'bR.svg', q: 'bQ.svg', k: 'bK.svg',
  };
  const parseFen = (fen) => {
    const [placement, activeColor = 'w'] = String(fen || '').trim().split(/\s+/);
    const ranks = placement ? placement.split('/') : [];
    if (ranks.length !== 8) throw new Error('Invalid FEN');

    const squares = [];
    ranks.forEach((rank) => {
      for (const token of rank) {
        if (/^[1-8]$/.test(token)) {
          squares.push(...Array(Number(token)).fill(null));
        } else if (pieceFiles[token]) {
          squares.push(token);
        } else {
          throw new Error('Invalid FEN');
        }
      }
    });
    if (squares.length !== 64) throw new Error('Invalid FEN');
    return { squares, activeColor };
  };

  const squareIndex = (square) => {
    if (!/^[a-h][1-8]$/.test(square)) return -1;
    return (8 - Number(square[1])) * 8 + square.charCodeAt(0) - 97;
  };

  const applyFirstMove = (position, rawMove) => {
    const move = String(rawMove || '').trim().toLowerCase();
    if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(move)) return null;

    const from = squareIndex(move.slice(0, 2));
    const to = squareIndex(move.slice(2, 4));
    const squares = [...position.squares];
    const piece = squares[from];
    if (!piece) return null;

    const fromFile = from % 8;
    const toFile = to % 8;
    if (piece.toLowerCase() === 'p' && fromFile !== toFile && !squares[to]) {
      squares[to + (piece === 'P' ? 8 : -8)] = null;
    }
    if (piece.toLowerCase() === 'k' && Math.abs(fromFile - toFile) === 2) {
      const rowStart = Math.floor(from / 8) * 8;
      const rookFrom = rowStart + (toFile === 6 ? 7 : 0);
      const rookTo = rowStart + (toFile === 6 ? 5 : 3);
      squares[rookTo] = squares[rookFrom];
      squares[rookFrom] = null;
    }

    squares[from] = null;
    const promotion = move[4];
    squares[to] = promotion
      ? (piece === 'P' ? promotion.toUpperCase() : promotion)
      : piece;
    return {
      squares,
      activeColor: position.activeColor === 'w' ? 'b' : 'w',
      lastMove: [from, to],
    };
  };

  const renderBoard = (position) => {
    const orientation = position.activeColor === 'b' ? 'black' : 'white';
    const displayIndices = orientation === 'white'
      ? Array.from({ length: 64 }, (_, index) => index)
      : Array.from({ length: 64 }, (_, index) => 63 - index);
    const fragment = document.createDocumentFragment();

    displayIndices.forEach((squareIndexValue, displayIndex) => {
      const row = Math.floor(squareIndexValue / 8);
      const file = squareIndexValue % 8;
      const rank = 8 - row;
      const square = document.createElement('span');
      square.className = `puzzle-square${(row + file) % 2 ? ' is-dark' : ''}`;
      if (position.lastMove && position.lastMove.includes(squareIndexValue)) {
        square.classList.add('is-last-move');
      }

      const piece = position.squares[squareIndexValue];
      if (piece) {
        const image = document.createElement('img');
        image.className = 'puzzle-piece';
        image.src = `/assets/merida/${pieceFiles[piece]}`;
        image.alt = '';
        image.width = 48;
        image.height = 48;
        square.append(image);
      }

      if (displayIndex % 8 === 0) {
        const rankLabel = document.createElement('small');
        rankLabel.className = 'puzzle-coordinate puzzle-coordinate-rank';
        rankLabel.textContent = String(rank);
        square.append(rankLabel);
      }
      if (displayIndex >= 56) {
        const fileLabel = document.createElement('small');
        fileLabel.className = 'puzzle-coordinate puzzle-coordinate-file';
        fileLabel.textContent = String.fromCharCode(97 + file);
        square.append(fileLabel);
      }
      fragment.append(square);
    });

    boardElement.replaceChildren(fragment);
    boardElement.dataset.orientation = orientation;
    shell.classList.add('is-ready');
  };

  const hidePreview = () => shell.classList.add('is-unavailable');
  if (!identifier || identifier.length > 128) {
    hidePreview();
    return;
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 6000);
  const query = new URLSearchParams({
    id: `eq.${identifier}`,
    select: 'fen,moves',
    limit: '1',
  });

  fetch(`${projectUrl}/rest/v1/puzzle?${query}`, {
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${publishableKey}`,
      Accept: 'application/json',
    },
    signal: controller.signal,
  })
    .then((response) => {
      if (!response.ok) throw new Error(`Puzzle request failed: ${response.status}`);
      return response.json();
    })
    .then((rows) => {
      const puzzle = Array.isArray(rows) ? rows[0] : null;
      if (!puzzle || !puzzle.fen) throw new Error('Puzzle not found');
      const initialPosition = parseFen(puzzle.fen);
      const firstMove = String(puzzle.moves || '').trim().split(/\s+/)[0];
      renderBoard(applyFirstMove(initialPosition, firstMove) || initialPosition);
    })
    .catch(hidePreview)
    .finally(() => window.clearTimeout(timeout));
})();
