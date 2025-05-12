import { useState } from 'react';
import Button from '../../components/Button';
import { RefreshCw } from 'lucide-react';

// Sudoku puzzle (0 = vazio)
const initialBoard = [
  [5,3,0,0,7,0,0,0,0],
  [6,0,0,1,9,5,0,0,0],
  [0,9,8,0,0,0,0,6,0],
  [8,0,0,0,6,0,0,0,3],
  [4,0,0,8,0,3,0,0,1],
  [7,0,0,0,2,0,0,0,6],
  [0,6,0,0,0,0,2,8,0],
  [0,0,0,4,1,9,0,0,5],
  [0,0,0,0,8,0,0,7,9],
];

function getConflicts(board: number[][], row: number, col: number, val: number) {
  const conflicts: [number, number][] = [];
  // Linha e coluna
  for (let i = 0; i < 9; i++) {
    if (i !== col && board[row][i] === val) conflicts.push([row, i]);
    if (i !== row && board[i][col] === val) conflicts.push([i, col]);
  }
  // Bloco 3x3
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++) {
      const rr = boxRow + r, cc = boxCol + c;
      if ((rr !== row || cc !== col) && board[rr][cc] === val) conflicts.push([rr, cc]);
    }
  return conflicts;
}

function isComplete(board: number[][]) {
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++)
      if (board[r][c] === 0) return false;
  return true;
}

export default function SudokuGame() {
  const [board, setBoard] = useState<number[][]>(initialBoard.map(row => [...row]));
  const [won, setWon] = useState(false);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [conflicts, setConflicts] = useState<[number, number][]>([]);

  const reset = () => {
    setBoard(initialBoard.map(row => [...row]));
    setWon(false);
    setSelected(null);
    setSelectedNumber(null);
    setConflicts([]);
  };

  const handleCellClick = (r: number, c: number) => {
    if (won) return;
    if (initialBoard[r][c] !== 0) return;
    setSelected([r, c]);
  };

  const handleNumberClick = (num: number) => {
    setSelectedNumber(num);
    if (selected && initialBoard[selected[0]][selected[1]] === 0 && !won) {
      const [r, c] = selected;
      if (num < 1 || num > 9) return;
      const newBoard = board.map(row => [...row]);
      newBoard[r][c] = num;
      setBoard(newBoard);

      // Checa conflitos
      const foundConflicts = getConflicts(newBoard, r, c, num);
      setConflicts(foundConflicts.length > 0 ? [[r, c], ...foundConflicts] : []);

      setSelected(null);
      setSelectedNumber(null);
      if (isComplete(newBoard) && foundConflicts.length === 0) setWon(true);
    }
  };

  const isConflict = (r: number, c: number) =>
    conflicts.some(([rr, cc]) => rr === r && cc === c);

  return (
    <div className="flex flex-col items-center">
      <div className="mb-2 flex gap-2">
        <Button size="sm" onClick={reset} leftIcon={<RefreshCw className="h-4 w-4" />}>Reiniciar</Button>
      </div>
      <div className="grid grid-cols-9 gap-[2px] bg-muted p-2 rounded-lg shadow-inner">
        {board.map((row, r) =>
          row.map((cell, c) => {
            const isInitial = initialBoard[r][c] !== 0;
            const isSelected = selected && selected[0] === r && selected[1] === c;
            const conflict = isConflict(r, c);
            return (
              <div
                key={r + '-' + c}
                className={`
                  w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center border
                  ${((Math.floor(r/3)+Math.floor(c/3))%2===0) ? 'bg-card' : 'bg-muted'}
                  ${isInitial ? 'font-bold text-primary' : 'text-foreground'}
                  ${isSelected ? 'ring-2 ring-primary' : ''}
                  ${conflict ? 'bg-red-200 text-red-700 animate-pulse' : ''}
                  border-border rounded cursor-pointer select-none
                  transition-all
                `}
                onClick={() => handleCellClick(r, c)}
              >
                {cell !== 0 ? cell : ''}
              </div>
            );
          })
        )}
      </div>
      {/* Números para selecionar */}
      <div className="flex gap-2 mt-4">
        {[1,2,3,4,5,6,7,8,9].map(num => (
          <button
            key={num}
            className={`
              w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold
              border border-border
              ${selectedNumber === num ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground hover:bg-primary/10'}
              transition-colors
            `}
            onClick={() => handleNumberClick(num)}
            disabled={won}
          >
            {num}
          </button>
        ))}
      </div>
      {won && <div className="mt-3 text-green-600 font-semibold">Parabéns! Você completou o Sudoku!</div>}
      {conflicts.length > 0 && !won && (
        <div className="mt-2 text-xs text-red-600 font-semibold">
          Conflito! O número está repetido na linha, coluna ou bloco.
        </div>
      )}
      <div className="mt-2 text-xs text-muted-foreground">Clique em uma célula e depois em um número para preencher. Se houver erro, a célula ficará vermelha.</div>
    </div>
  );
}
