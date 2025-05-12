import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/Button';
import { Home, RefreshCw } from 'lucide-react';

const bitcoinFacts = [
  { title: "Soberania", description: "Bitcoin permite controle total sobre seu dinheiro sem intermediários." },
  { title: "Descentralização", description: "Não existe um ponto central de controle ou falha." },
  { title: "Escassez Digital", description: "Apenas 21 milhões de bitcoins existirão." },
  { title: "Privacidade", description: "Transações pseudônimas protegem sua identidade." },
  { title: "Resistência à Censura", description: "Ninguém pode impedir suas transações." },
  { title: "Imutabilidade", description: "O histórico de transações não pode ser alterado." },
  { title: "Acessibilidade", description: "Qualquer pessoa com internet pode usar Bitcoin." },
  { title: "Transparência", description: "Todas as transações são públicas e verificáveis." },
  { title: "Divisibilidade", description: "Cada bitcoin pode ser dividido em 100 milhões de satoshis." },
  { title: "Programabilidade", description: "Bitcoin permite contratos e regras programáveis." },
  { title: "Portabilidade", description: "Bitcoins podem ser levados para qualquer lugar do mundo." },
  { title: "Durabilidade", description: "Bitcoins não degradam fisicamente e existem digitalmente." }
];

export default function BitcoinCardsGame() {
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [foundCard, setFoundCard] = useState(false);
  const [winningCard, setWinningCard] = useState<number>(0);

  useEffect(() => {
    resetGame();
  }, []);

  const resetGame = () => {
    setFlippedCards([]);
    setFoundCard(false);
    setWinningCard(Math.floor(Math.random() * bitcoinFacts.length));
  };

  const flipCard = (cardIndex: number) => {
    if (!flippedCards.includes(cardIndex) && !foundCard) {
      const newFlippedCards = [...flippedCards, cardIndex];
      setFlippedCards(newFlippedCards);
      if (cardIndex === winningCard) setFoundCard(true);
    }
  };

  return (
    <div className="w-full flex justify-center">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4 max-w-xs sm:max-w-xl md:max-w-3xl mx-auto w-full">
        {bitcoinFacts.map((fact, index) => {
          const isFlipped = flippedCards.includes(index);
          const isWinner = index === winningCard && foundCard;
          return (
            <div
              key={index}
              className={`
                group card-flip relative w-full h-28 sm:h-32 md:h-40 cursor-pointer select-none
                transition-transform duration-300
                ${isFlipped ? 'flipped' : ''}
                ${isWinner ? 'ring-4 ring-completed' : ''}
              `}
              onClick={() => flipCard(index)}
              tabIndex={0}
              aria-label={`Carta ${fact.title}`}
            >
              {/* Frente da carta */}
              <div className="card-front absolute inset-0 w-full h-full rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-md transition-opacity duration-300">
                <span className="text-3xl md:text-4xl text-primary-foreground font-bold">₿</span>
              </div>
              {/* Verso da carta */}
              <div className="card-back absolute inset-0 w-full h-full rounded-lg flex flex-col items-center justify-center p-2 text-center shadow-md transition-opacity duration-300">
                <div className={`
                  w-full h-full rounded-lg p-2 flex flex-col items-center justify-center
                  ${isWinner ? 'bg-green-100 border-2 border-green-500' : 'bg-card border-2 border-primary/30'}
                `}>
                  <h3 className={`font-bold text-xs sm:text-sm mb-1 ${isWinner ? 'text-green-700' : 'text-card-foreground'}`}>
                    {fact.title}
                  </h3>
                  <p className={`text-[10px] sm:text-xs ${isWinner ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {fact.description}
                  </p>
                  {isWinner && (
                    <>
                      <div className="mt-2 mb-1 text-green-700 font-semibold text-xs sm:text-sm">
                        Parabéns! Você encontrou a página correta.
                      </div>
                      <div className="mt-1 md:mt-2 flex gap-1 md:gap-2">
                        <Button
                          size="sm"
                          onClick={e => {
                            e.stopPropagation();
                            resetGame();
                          }}
                          leftIcon={<RefreshCw className="h-3 w-3" />}
                          className="py-0.5 px-1.5 text-[10px] md:py-1 md:px-2 md:text-xs"
                        >
                          Jogar Novamente
                        </Button>
                        <Link
                          to="/"
                          onClick={e => e.stopPropagation()}
                        >
                          <Button
                            size="sm"
                            variant="outline"
                            leftIcon={<Home className="h-3 w-3" />}
                            className="py-0.5 px-1.5 text-[10px] md:py-1 md:px-2 md:text-xs"
                          >
                            Início
                          </Button>
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
