import { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';
import { Home, Grid, Zap, LayoutGrid, Sun, Moon, RefreshCw } from 'lucide-react';
import BitcoinCardsGame from './games/BitcoinCardsGame';
import MinesweeperGame from './games/MinesweeperGame';
import SudokuGame from './games/SudokuGame';

const GAME_LABELS: Record<string, string> = {
  menu: '',
  cartas: 'Cartas Bitcoin',
  minado: 'Campo Minado',
  sudoku: 'Sudoku'
};

export default function NotFound() {
  const [game, setGame] = useState<'menu' | 'cartas' | 'minado' | 'sudoku'>('menu');
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));

  // Troca tema
  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
    setDark(document.documentElement.classList.contains('dark'));
  };

  // Reinício global
  const handleRestart = () => {
    setGame('menu');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background relative overflow-hidden transition-colors duration-500">
      {/* Logo Bitcoin e tema */}
      <div className="absolute top-4 md:top-8 left-0 right-0 flex justify-center items-center gap-4 pointer-events-none select-none z-20">
        <div className="bg-primary/10 p-3 rounded-full pointer-events-auto">
          <svg width="40" height="40" viewBox="0 0 24 24" className="text-primary" fill="currentColor">
            <path d="M23.638 14.904c-1.602 6.43-8.113 10.34-14.542 8.736C2.67 22.05-1.244 15.525.362 9.105 1.962 2.67 8.475-1.243 14.9.358c6.43 1.605 10.342 8.115 8.738 14.548v-.002zm-6.35-4.613c.24-1.59-.974-2.45-2.64-3.03l.54-2.153-1.315-.33-.525 2.107c-.345-.087-.705-.167-1.064-.25l.526-2.127-1.32-.33-.54 2.165c-.285-.067-.565-.132-.84-.2l-1.815-.45-.35 1.4s.975.225.955.236c.535.136.63.486.615.766l-1.477 5.92c-.075.166-.24.406-.614.314.015.02-.96-.24-.96-.24l-.66 1.51 1.71.426.93.242-.54 2.19 1.32.327.54-2.17c.36.1.705.19 1.05.273l-.51 2.154 1.32.33.545-2.19c2.24.427 3.93.257 4.64-1.774.57-1.637-.03-2.58-1.217-3.196.854-.193 1.5-.76 1.68-1.93h.01zm-3.01 4.22c-.404 1.64-3.157.75-4.05.53l.72-2.9c.896.23 3.757.67 3.33 2.37zm.41-4.24c-.37 1.49-2.662.735-3.405.55l.654-2.64c.744.18 3.137.524 2.75 2.084v.006z" />
          </svg>
        </div>
        <button
          className="ml-2 p-2 rounded-full bg-muted/70 hover:bg-muted transition-colors pointer-events-auto"
          onClick={toggleTheme}
          title={dark ? 'Tema claro' : 'Tema escuro'}
        >
          {dark ? <Sun className="h-5 w-5 text-yellow-500" /> : <Moon className="h-5 w-5 text-primary" />}
        </button>
      </div>

      <div className="text-center z-10 mb-4 md:mb-8 mt-16 md:mt-0">
        <h1 className="text-lg md:text-xl font-semibold text-foreground">
          Você encontrou uma página inesperada!
        </h1>
        <p className="text-muted-foreground mt-2 max-w-md">
          Jogue um jogo enquanto procura a página correta:
        </p>
        {game !== 'menu' && (
          <div className="mt-2 text-primary font-bold text-base animate-fade-in">
            {GAME_LABELS[game]}
          </div>
        )}
      </div>

      {/* Instruções rápidas */}
      {game === 'menu' && (
        <div className="mb-4 text-xs text-muted-foreground max-w-md text-center">
          <div>Escolha um minigame para se divertir:</div>
          <ul className="list-disc list-inside mt-1 text-left mx-auto max-w-xs">
            <li><b>Cartas Bitcoin:</b> Vire cartas e encontre a correta.</li>
            <li><b>Campo Minado:</b> Clique para revelar, botão direito para marcar bandeira. Veja seu recorde!</li>
            <li><b>Sudoku:</b> Preencha o tabuleiro 9x9. Erros ficam destacados.</li>
          </ul>
        </div>
      )}

      {/* Menu de jogos */}
      {game === 'menu' && (
        <div className="flex flex-col gap-4 items-center w-full max-w-xs animate-fade-in">
          <Button className="w-full" leftIcon={<Zap className="h-5 w-5" />} onClick={() => setGame('cartas')}>
            Cartas Bitcoin
          </Button>
          <Button className="w-full" leftIcon={<Grid className="h-5 w-5" />} onClick={() => setGame('minado')}>
            Campo Minado
          </Button>
          <Button className="w-full" leftIcon={<LayoutGrid className="h-5 w-5" />} onClick={() => setGame('sudoku')}>
            Sudoku
          </Button>
        </div>
      )}

      {/* Jogos */}
      {game !== 'menu' && (
        <div className="w-full flex flex-col items-center animate-fade-in">
          <div className="mb-4 flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setGame('menu')}>Voltar</Button>
            <Button variant="ghost" size="sm" onClick={handleRestart} leftIcon={<RefreshCw className="h-4 w-4" />}>Reiniciar Tudo</Button>
          </div>
          {game === 'cartas' && <BitcoinCardsGame />}
          {game === 'minado' && <MinesweeperGame />}
          {game === 'sudoku' && <SudokuGame />}
        </div>
      )}

      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute bg-primary/5 rounded-full"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 100 + 50}px`,
              height: `${Math.random() * 100 + 50}px`,
              opacity: Math.random() * 0.7,
              transform: `scale(${Math.random() * 0.5 + 0.5})`,
            }}
          />
        ))}
      </div>

      {/* Botão escondido no canto inferior direito */}
      <Link
        to="/"
        className="absolute bottom-2 right-2 text-primary/20 hover:text-primary/80 transition-colors z-10"
        title="Voltar discretamente"
      >
        <Home className="h-4 w-4" />
      </Link>
      <style>{`
        .animate-fade-in { animation: fadeIn .5s; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(16px);} to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  );
}