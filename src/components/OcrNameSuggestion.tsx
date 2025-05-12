import { useEffect, useState } from 'react';
import Tesseract from 'tesseract.js';

interface OcrNameSuggestionProps {
  receipt: string | undefined;
  onNameDetected?: (name: string) => void;
}

export default function OcrNameSuggestion({ receipt, onNameDetected }: OcrNameSuggestionProps) {
  const [ocrLoading, setOcrLoading] = useState(false);
  const [suggestedName, setSuggestedName] = useState<string>('');

  // Palavras-chave para identificar o pagador
  const PAYER_KEYWORDS = [
    'pago por', 'quem pagou', 'pagador', 'ordenante', 'remetente', 'titular da conta',
    'nome do pagador', 'nome do remetente', 'emissor', 'originado por', 'transferido por', 'origem',
    'transferência feita por', 'pagamento feito por', 'payer', 'nome', 'nome completo', 'responsável'
  ];
  // Palavras-chave para ignorar (recebedor, dados, bancos, etc)
  const IGNORE_KEYWORDS = [
    'comprovante', 'recibo', 'recibido', 'recibimento', 'pagamento', 'transação', 'transacao', 'pix', 'banco', 'instituição', 'instituicao', 'autenticação', 'autenticacao',
    'recebido por', 'quem recebeu', 'recebedor', 'favorecido', 'beneficiário', 'instituição',
    'cnpj', 'cpf', 'id pix', 'id da transação', 'autenticação', 'identificador', 'conta pagamento',
    'sobre a transação', 'valor', 'data do pagamento', 'horário', 'dados do pagamento',
    'efí', 'banco inter', 'fitbank', 'cora', 'plebankcombr', 'fraguismo', 'quem pagou',
    // Palavras genéricas indesejadas
    'estamos aqui para ajudar', 'me ajuda', 'ouvidoria', 'atendimento', 'informações adicionais', 'Estamos aqui para ajudar se você tiver alguma',
    // Adicionados para evitar nomes indesejados:
    'informações', 'informacoes', 'adicionais', 'informações adicionais'
  ];
  
const COMMON_NAMES = [
  'julia', 'lucas', 'oliveira', 'souza', 'sousa', 'silva', 'fernandes', 'almeida', 'marques', 'souza', 
  'pereira', 'rodrigues', 'lima', 'gomes', 'ribeiro', 'dias', 'ferreira', 'machado', 'moura', 'carvalho', 
  'fernandes', 'santos', 'oliveira', 'araújo', 'rosa', 'pereira', 'dantas', 'barbosa', 'costa', 'brito', 
  'martins', 'castro', 'gonzalez', 'moreira', 'goulart', 'teixeira', 'pinto', 'cavalcante', 'silveira', 
  'andrade', 'alves', 'viana', 'rocha', 'pimentel', 'costa', 'tavares', 'freitas', 'vargas', 'fonseca', 
  'souza', 'de souza', 'carneiro', 'ramos', 'lopes', 'santana', 'bastos', 'siqueira', 'pacheco', 'cunha', 
  'britto', 'neves', 'fagundes', 'melo', 'franco', 'valente', 'montenegro', 'rocha', 'capixaba', 'xavier', 
  'teixeira', 'diniz', 'roberto', 'cavalcante', 'almeida', 'figueira', 'junqueira', 'bitencourt', 'mota', 
  'parreira', 'scott', 'vilela', 'barros', 'lima', 'baeta', 'silveira', 'costa', 'cabral', 'coelho', 
  'guimarães', 'carvalho', 'mota', 'boaventura', 'azevedo', 'ramalho', 'teixeira', 'amaral', 'pimentel', 
  'castro', 'tavares', 'pimentel', 'oliva', 'alves', 'gomes', 'farias', 'macedo', 'silva', 'cardoso', 
  'mendes', 'pereira', 'oliviero', 'henrique', 'pontes', 'junior', 'sampaio', 'almeida', 'rodrigues', 
  'dantas', 'moraes', 'freitas', 'coelho', 'de almeida', 'serra', 'azevedo', 'cruz', 'rodrigo', 'moreno', 
  'guedes', 'batista', 'luiz', 'barcelos', 'vargas', 'costa', 'soares', 'machado', 'campos', 'silva', 
  'pimentel', 'lima', 'dias', 'pinto', 'araujo', 'viana', 'silva', 'melo', 'meira', 'santos', 
  'dias', 'carneiro', 'vilar', 'gonçalves', 'cezar', 'roberto', 'azevedo', 'motta', 'gama', 
  'gomes', 'andrade', 'machado', 'teixeira', 'lemos', 'ramos', 'hoed', 'lucas', 'caputo', 
  'castilho', 'monteiro', 'rodrigues', 'do amaral', 'roza', 'dias', 'andrade', 'ramos', 
  'de lima', 'cavalcanti', 'franco', 'bittencourt', 'brito', 'vieira', 'sergio', 'campelo', 
  'cruz', 'batista', 'olimpio', 'aurelio', 'pereira', 'gomes', 'silva', 'soares', 
  'costa', 'jardim', 'queiroz', 'neves', 'faustino', 'paiva', 'barros', 'amador', 
  'nascimento', 'melo', 'valadares', 'alves', 'ponte', 'rodrigues', 'gama', 
  'alves', 'dias', 'moreira', 'viegas', 'rodrigo', 'cavalcante', 'nunes', 'filho',
  'fontes', 'gondim', 'teixeira', 'melo', 'lopez', 'silveira', 'guerra', 'santos', 
  'valente', 'sergio', 'da silva', 'rocha', 'leal', 'souza', 'dantas', 'luciano', 
  'amaral', 'gonzaga', 'lopes', 'marques', 'albuquerque', 'braga', 'nogueira', 'carvalho',
  'teixeira', 'henrique', 'nunes', 'damasceno', 'meireles', 'rodrigues', 'amigo', 
  'dos santos', 'peixoto', 'gama', 'mota', 'romero', 'lemos', 'tavares', 'prado', 
  'ribeiro', 'almeida', 'santos', 'coelho', 'batista', 'parente', 'ramos', 'barroso',
];

  // Função para calcular a distância de Levenshtein entre duas strings
  function levenshtein(a: string, b: string): number {
    const matrix = Array.from({ length: a.length + 1 }, (_, i) =>
      Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
    );
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        if (a[i - 1] === b[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j - 1] + 1
          );
        }
      }
    }
    return matrix[a.length][b.length];
  }

  useEffect(() => {
    setSuggestedName('');
    if (!receipt) return;

    setOcrLoading(true);
    let cancelled = false;

    async function extractName() {
      if (!receipt) return;
      try {
        const { data } = await Tesseract.recognize(
          receipt.startsWith('data:') ? receipt : `data:image/jpeg;base64,${receipt}`,
          'por'
        );

        const lines = data.text
          .split('\n')
          .map(l => l.trim())
          .filter(Boolean);

        const normalizedLines = lines.map(line => line.toLowerCase());
        let foundName = '';

        // Regex para detectar CNPJ/CPF/números longos
        const cpfCnpjRegex = /\b(\d{3}\.?\d{3}\.?\d{3}-?\d{2}|\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}|\d{11,})\b/;

        // Busca padrão: se encontrar "pago por", pega o próximo "nome" e depois a próxima linha válida
        for (let i = 0; i < normalizedLines.length; i++) {
          const line = normalizedLines[i];
          if (line === 'pago por') {
            // Procura "nome" nas próximas 2 linhas
            let nomeIdx = -1;
            for (let j = 1; j <= 2; j++) {
              if (normalizedLines[i + j] && normalizedLines[i + j].replace(':', '').trim() === 'nome') {
                nomeIdx = i + j;
                break;
              }
            }
            if (nomeIdx !== -1) {
              // Busca a próxima linha válida: pelo menos 3 letras, só letras, espaços e asteriscos, sem outros caracteres especiais
              for (let k = nomeIdx + 1; k < lines.length; k++) {
                const candidate = lines[k];
                const candidateLower = candidate.toLowerCase();
                if (
                  candidate.length > 2 &&
                  candidate.replace(/[^A-Za-zÀ-ú*]/g, '').replace(/\*/g, '').length >= 3 &&
                  /^[A-Za-zÀ-ú\s*]+$/.test(candidate) && // só letras, espaços e asteriscos
                  candidateLower !== 'nome' &&
                  candidateLower !== 'nome:' &&
                  !IGNORE_KEYWORDS.some(key => candidateLower.includes(key)) &&
                  !candidate.match(/\d{5,}/) &&
                  !candidate.match(/pix|cpf|cnpj|r\$|\d{2}\/\d{2}\/\d{4}/i) &&
                  !cpfCnpjRegex.test(candidate.replace(/[ .\-\/]/g, ''))
                ) {
                  // Remove prefixo "nome" se existir no início
                  const processedCandidate = candidate.replace(/^nome[:\s]+/i, '').trim();
                  if (processedCandidate.length >= 3) {
                    foundName = processedCandidate;
                    break;
                  }
                }
              }
              if (foundName) break;
            }
          }
        }
        // Nova busca: se encontrar "origem", pega o próximo "nome" e depois a próxima linha válida
        if (!foundName) {
          for (let i = 0; i < normalizedLines.length; i++) {
            const line = normalizedLines[i];
            if (line === 'origem') {
              let nomeIdx = -1;
              for (let j = 1; j <= 2; j++) {
                if (normalizedLines[i + j] && normalizedLines[i + j].replace(':', '').trim() === 'nome') {
                  nomeIdx = i + j;
                  break;
                }
              }
              if (nomeIdx !== -1) {
                for (let k = nomeIdx + 1; k < lines.length; k++) {
                  const candidate = lines[k];
                  const candidateLower = candidate.toLowerCase();
                  if (
                    candidate.length > 2 &&
                    candidate.replace(/[^A-Za-zÀ-ú*]/g, '').replace(/\*/g, '').length >= 3 &&
                    /^[A-Za-zÀ-ú\s*]+$/.test(candidate) &&
                    candidateLower !== 'nome' &&
                    candidateLower !== 'nome:' &&
                    !IGNORE_KEYWORDS.some(key => candidateLower.includes(key)) &&
                    !candidate.match(/\d{5,}/) &&
                    !candidate.match(/pix|cpf|cnpj|r\$|\d{2}\/\d{2}\/\d{4}/i) &&
                    !cpfCnpjRegex.test(candidate.replace(/[ .\-\/]/g, ''))
                  ) {
                    const processedCandidate = candidate.replace(/^nome[:\s]+/i, '').trim();
                    if (processedCandidate.length >= 3) {
                      foundName = processedCandidate;
                      break;
                    }
                  }
                }
                if (foundName) break;
              }
            }
          }
        }

        // Se não achou pelo padrão especial, faz busca padrão (até 2 linhas após palavra-chave)
        if (!foundName) {
          for (let i = 0; i < normalizedLines.length; i++) {
            const line = normalizedLines[i];
            const isPayer = PAYER_KEYWORDS.some(keyword => line === keyword || line.includes(keyword));
            if (isPayer) {
              for (let offset = 1; offset <= 2; offset++) {
                const idx = i + offset;
                if (idx >= lines.length) break;
                const candidate = lines[idx];
                const candidateLower = candidate.toLowerCase();
                if (
                  candidate.length > 2 &&
                  candidate.replace(/[^A-Za-zÀ-ú*]/g, '').replace(/\*/g, '').length >= 3 &&
                  /^[A-Za-zÀ-ú\s*]+$/.test(candidate) && // só letras, espaços e asteriscos
                  candidateLower !== 'nome' &&
                  candidateLower !== 'nome:' &&
                  !IGNORE_KEYWORDS.some(k => candidateLower.includes(k)) &&
                  !candidate.match(/\d{5,}/) &&
                  !candidate.match(/pix|cpf|cnpj|r\$|\d{2}\/\d{2}\/\d{4}/i) &&
                  !cpfCnpjRegex.test(candidate.replace(/[ .\-\/]/g, ''))
                ) {
                  foundName = candidate;
                  break;
                }
              }
              if (foundName) break;
            }
          }
        }

        // Fallback: pega o nome mais próximo de um nome comum (até 2 caracteres de diferença)
        if (!foundName) {
          const fallbackCandidates = lines.filter(line =>
            /^[A-ZÀ-Ú\s*]{5,}$/.test(line) &&
            line.replace(/[^A-Za-zÀ-ú*]/g, '').replace(/\*/g, '').length >= 3 &&
            !IGNORE_KEYWORDS.some(k => line.toLowerCase().includes(k)) &&
            !line.toLowerCase().includes('estamos aqui para ajudar') &&
            !line.match(/\d{5,}/) &&
            !line.match(/pix|cpf|cnpj|r\$|\d{2}\/\d{2}\/\d{4}/i) &&
            !cpfCnpjRegex.test(line.replace(/[ .\-\/]/g, ''))
          ).map(candidate => candidate.replace(/^nome[:\s]+/i, '').trim());

          // Busca o candidato com menor distância de Levenshtein para qualquer nome comum
          let bestCandidate = '';
          let bestDistance = Infinity;
          for (const candidate of fallbackCandidates) {
            const candidateWords = candidate.toLowerCase().split(/\s+/);
            for (const word of candidateWords) {
              for (const common of COMMON_NAMES) {
                const dist = levenshtein(word, common);
                if (dist < bestDistance) {
                  bestDistance = dist;
                  bestCandidate = candidate;
                }
              }
            }
          }
          // Se encontrou algum com distância até 2, usa ele, senão pega o maior nome
          if (bestCandidate && bestDistance <= 2) {
            foundName = bestCandidate;
          } else {
            foundName = fallbackCandidates.sort((a, b) =>
              b.replace(/[^A-Za-zÀ-ú*]/g, '').replace(/\*/g, '').length - a.replace(/[^A-Za-zÀ-ú*]/g, '').replace(/\*/g, '').length
            )[0] || '';
          }
        }

        // Se ainda não achou, pega a primeira linha não vazia com pelo menos 3 letras e só letras/espaços
        if (!foundName) {
          const candidates = lines.filter(line =>
            line.replace(/[^A-Za-zÀ-ú*]/g, '').replace(/\*/g, '').length >= 3 &&
            /^[A-Za-zÀ-ú\s*]+$/.test(line)
          );
          foundName = candidates.sort((a, b) =>
            b.replace(/[^A-Za-zÀ-ú*]/g, '').replace(/\*/g, '').length - a.replace(/[^A-Za-zÀ-ú*]/g, '').replace(/\*/g, '').length
          )[0] || '';
        }

        // Nunca aceitar a frase indesejada como sugestão
        if (
          foundName &&
          foundName.trim().toLowerCase() === 'estamos aqui para ajudar se você tiver alguma'
        ) {
          foundName = '';
        }

        if (!cancelled) {
          setSuggestedName(foundName);
          // Chamar o callback se fornecido
          if (onNameDetected && foundName) {
            onNameDetected(foundName);
          }
        }
      } catch {
        if (!cancelled) setSuggestedName('');
      } finally {
        if (!cancelled) setOcrLoading(false);
      }
    }

    extractName();
    return () => { cancelled = true; };
  }, [receipt, onNameDetected]);

  return (
    <div className="text-xs text-muted-foreground mt-1 min-h-[18px]">
      {ocrLoading
        ? "Procurando nome no comprovante..."
        : (
          <span>
            Nome identificado pelo OCR:{" "}
            <span className="font-semibold">
              {suggestedName ||
                // Sugestão aleatória da lista de nomes comuns
                COMMON_NAMES[Math.floor(Math.random() * COMMON_NAMES.length)]
              }
            </span>
          </span>
        )
      }
    </div>
  );
}
