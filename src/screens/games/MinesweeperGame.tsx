import { useState, useEffect } from 'react';
import Button from '../../components/Button';
import { RefreshCw, Flag } from 'lucide-react';

function generateMinesweeperBoard(rows: number, cols: number, mines: number) {
  const board = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ mine: false, revealed: false, flagged: false, adjacent: 0 }))
  );
  let placed = 0;
  while (placed < mines) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    if (!board[r][c].mine) {
      board[r][c].mine = true;
      placed++;
    }
  }
  // Calculate adjacent mines
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c].mine) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc].mine) count++;
        }
      }
      board[r][c].adjacent = count;
    }
  }
  return board;
}

export default function MinesweeperGame() {
  const rows = 8, cols = 8, mines = 10;
  const [board, setBoard] = useState<any[][]>([]);
  const [lost, setLost] = useState(false);
  const [won, setWon] = useState(false);
  const [flags, setFlags] = useState(0);
  const [champion, setChampion] = useState<number>(() => Number(localStorage.getItem('minesweeperWins') || 0));

  useEffect(() => {
    reset();
  }, []);

  const reset = () => {
    setBoard(generateMinesweeperBoard(rows, cols, mines));
    setLost(false);
    setWon(false);
    setFlags(0);
  };

  const reveal = (r: number, c: number) => {
    if (lost || won || board[r][c].revealed || board[r][c].flagged) return;
    const newBoard = board.map(row => row.map(cell => ({ ...cell })));
    const revealCell = (x: number, y: number) => {
      if (x < 0 || x >= rows || y < 0 || y >= cols || newBoard[x][y].revealed || newBoard[x][y].flagged) return;
      newBoard[x][y].revealed = true;
      if (newBoard[x][y].adjacent === 0 && !newBoard[x][y].mine) {
        for (let dr = -1; dr <= 1; dr++)
          for (let dc = -1; dc <= 1; dc++)
            if (dr !== 0 || dc !== 0) revealCell(x + dr, y + dc);
      }
    };
    if (newBoard[r][c].mine) {
      newBoard[r][c].revealed = true;
      setLost(true);
      setBoard(newBoard);
      return;
    }
    revealCell(r, c);
    // Check win
    const allRevealed = newBoard.flat().filter(cell => !cell.mine).every(cell => cell.revealed);
    if (allRevealed) {
      setWon(true);
      const newChampion = champion + 1;
      setChampion(newChampion);
      localStorage.setItem('minesweeperWins', String(newChampion));
    }
    setBoard(newBoard);
  };

  const toggleFlag = (r: number, c: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (lost || won || board[r][c].revealed) return;
    const newBoard = board.map(row => row.map(cell => ({ ...cell })));
    newBoard[r][c].flagged = !newBoard[r][c].flagged;
    setFlags(newBoard.flat().filter(cell => cell.flagged).length);
    setBoard(newBoard);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="mb-2 flex gap-2">
        <Button size="sm" onClick={reset} leftIcon={<RefreshCw className="h-4 w-4" />}>Reiniciar</Button>
        <span className="text-sm text-muted-foreground flex items-center gap-1">
          <Flag className="h-4 w-4" /> {flags}/{mines}
        </span>
        <span className="text-sm text-green-700 font-semibold">Campeão: {champion}</span>
      </div>
      <div className="grid grid-cols-8 gap-1 bg-muted p-2 rounded-lg shadow-inner">
        {board.map((row, r) =>
          row.map((cell, c) => (
            <button
              key={r + '-' + c}
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded text-xs font-bold flex items-center justify-center
                ${cell.revealed ? (cell.mine ? 'bg-red-200 text-red-700' : 'bg-card text-foreground') : 'bg-primary/20 text-primary'}
                border border-border relative select-none`}
              onClick={() => reveal(r, c)}
              onContextMenu={e => toggleFlag(r, c, e)}
              disabled={cell.revealed || lost || won}
            >
              {cell.revealed ? (cell.mine ? '💣' : (cell.adjacent || '')) : (cell.flagged ? <Flag className="h-4 w-4 text-yellow-600" /> : '')}
            </button>
          ))
        )}
      </div>
      {lost && <div className="mt-3 text-red-600 font-semibold">Você perdeu! 💥</div>}
      {won && <div className="mt-3 text-green-600 font-semibold">Parabéns! Você venceu o campo minado!</div>}
      <div className="mt-2 text-xs text-muted-foreground">Clique com o botão direito para marcar/desmarcar bandeira.</div>
    </div>
  );
}
