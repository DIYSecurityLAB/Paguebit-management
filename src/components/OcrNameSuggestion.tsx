import { useEffect, useState } from 'react';
import Tesseract from 'tesseract.js';

interface OcrNameSuggestionProps {
  receipt: string | undefined;
  onNameDetected?: (name: string) => void;
  onTargetNameCheck?: (hasTargetName: boolean) => void; // renomeado
}

export default function OcrNameSuggestion({ receipt, onNameDetected, onTargetNameCheck }: OcrNameSuggestionProps) {
  const [ocrLoading, setOcrLoading] = useState(false);
  const [suggestedName, setSuggestedName] = useState<string>('');
  const [hasTargetName, setHasTargetName] = useState<boolean | null>(null); // renomeado

  // Palavras-chave para identificar o pagador - divididas por prioridade
  const HIGH_PRIORITY_KEYWORDS = [
    'dados de quem pagou', 'quem pagou', 'pagador', 'origem',
    'nome do pagador', 'nome do remetente', 'realizado por',
    'transferência feita por', 'pagamento feito por', 'dados do pagador'
  ];
  
  const MEDIUM_PRIORITY_KEYWORDS = [
    'pago por', 'ordenante', 'remetente', 'titular da conta',
    'emissor', 'originado por', 'transferido por', 
    'payer', 'nome', 'nome completo', 'responsável', 'pagante'
  ];
  
  // Palavras-chave de baixa prioridade (maior risco de falsos positivos)
  const LOW_PRIORITY_KEYWORDS = [
    'de', 'e de', 'sua compra'
  ];
  
  // Unir todas as palavras-chave por ordem de prioridade
  const PAYER_KEYWORDS = [
    ...HIGH_PRIORITY_KEYWORDS,
    ...MEDIUM_PRIORITY_KEYWORDS,
    ...LOW_PRIORITY_KEYWORDS
  ];

  // Palavras-chave para ignorar (recebedor, dados, bancos, etc)
  const IGNORE_KEYWORDS = [
    'comprovante', 'recibo', 'recibido', 'recibimento', 'pagamento', 'transação', 'transacao', 'pix', 'banco', 'instituição', 'instituicao', 'autenticação', 'autenticacao',
    'recebido por', 'quem recebeu', 'recebedor', 'favorecido', 'beneficiário', 'instituição',
    'cnpj', 'cpf', 'id pix', 'id da transação', 'autenticação', 'identificador', 'conta pagamento',
    'sobre a transação', 'valor', 'data do pagamento', 'horário', 'dados do pagamento',
    'efí', 'banco inter', 'fitbank', 'cora', 'plebankcombr', 'fraguismo', 'quem pagou', 'tcr finance', 'tcr', 'finance',
    // Palavras genéricas indesejadas
    'estamos aqui para ajudar', 'me ajuda', 'ouvidoria', 'atendimento', 'informações adicionais', 'Estamos aqui para ajudar se você tiver alguma',
    // Adicionados para evitar nomes indesejados:
    'informações', 'informacoes', 'adicionais', 'informações adicionais',
    // Adicionando palavras específicas do Mercado Pago
    'mercado pago', 'mercadopago', 'comprovante de pagamento', 'o comprovante de pagamento',
    'o&', 'id da transação pix', 'código de autenticação', 'atendimento ao cliente', 'ouvidoria',
    'sua compra', 'total', 'para', 'psp', 'quinta-feira', 'segunda-feira', 'terça-feira', 'quarta-feira',
    'sexta-feira', 'sábado', 'domingo', 'às',
    // Cabeçalhos e informações de comprovantes
    'dados do pagador', 'dados do recebedor', 'identificação', 'identificacao', 'instívição', 'instituicao', 'dados do', 'dados da'
  ];
  
const COMMON_NAMES = [
  // NOMES MASCULINOS
  'lucas', 'joão', 'gabriel', 'miguel', 'pedro', 'matheus', 'rafael', 'gustavo', 'henrique',
  'eduardo', 'arthur', 'bernardo', 'vinicius', 'felipe', 'caio', 'thiago', 'henry', 'enrico',
  'enzo', 'daniel', 'marcos', 'marcelo', 'rodrigo', 'renan', 'andre', 'bruno', 'igor',
  'diego', 'leonardo', 'nicolas', 'ricardo', 'william', 'alexandre', 'carlos', 'antonio',
  'luiz', 'vitor', 'paulo', 'jorge', 'emerson', 'aline', 'claudio', 'edson', 'samuel',
  'davi', 'henri', 'jean', 'caue', 'roberto', 'allan', 'ronaldo', 'gilberto', 'julio',
  'cesar', 'rodrigues', 'renato', 'wilson', 'edgar', 'fabricio', 'valter', 'diogo', 'tiago',
  'ismael', 'alex', 'ronan', 'fabio', 'edilson', 'anderson', 'rodrigo', 'gerson', 'edu',
  'luan', 'alberto', 'sergio', 'emanuel', 'mateus', 'otavio', 'pablo', 'vicente', 'gustavo',
  'hugo', 'leandro', 'josé', 'rafael', 'felix', 'robson', 'evandro', 'isaac', 'joaquim',

  // NOMES FEMININOS
  'maria', 'ana', 'julia', 'mariana', 'isabela', 'camila', 'leticia', 'larissa', 'beatriz',
  'aline', 'bruna', 'carla', 'fernanda', 'patricia', 'juliana', 'caroline', 'bianca',
  'valeria', 'nathalia', 'natalia', 'priscila', 'yara', 'lara', 'tatiane', 'tatiana',
  'dayane', 'elaine', 'eliane', 'simone', 'carol', 'luana', 'amanda', 'andressa',
  'cristina', 'raquel', 'adriana', 'gabriela', 'aline', 'tania', 'marcela', 'manuela',
  'lais', 'rayssa', 'deborah', 'renata', 'monique', 'isabel', 'heloisa', 'sofia',
  'laura', 'clara', 'ester', 'elisa', 'sabrina', 'alice', 'valentina', 'letícia',
  'flavia', 'viviane', 'rosana', 'patrícia', 'aline', 'edna', 'angela', 'tais',

  // SOBRENOMES MAIS COMUNS
  'silva', 'santos', 'oliveira', 'souza', 'sousa', 'pereira', 'lima', 'costa',
  'rodrigues', 'almeida', 'nascimento', 'araujo', 'fernandes', 'carvalho', 'gomes',
  'martins', 'ribeiro', 'barbosa', 'barros', 'freitas', 'batista', 'dias', 'teixeira',
  'moura', 'mendes', 'melo', 'castro', 'alves', 'cardoso', 'marques', 'vieira',
  'ferreira', 'machado', 'rocha', 'reis', 'dantas', 'viana', 'farias', 'ramos',
  'cavalcante', 'pinto', 'soares', 'morais', 'moreira', 'monteiro', 'macedo',
  'souza e silva', 'sousa e silva', 'de souza', 'de oliveira', 'da silva', 'dos santos',
  'de almeida', 'do nascimento', 'de araujo', 'de lima', 'de barros', 'da costa',
  'da rocha', 'da cruz', 'de castro', 'de andrade', 'de moraes', 'da conceição',

  // SOBRENOMES REGIONAIS / MENOS COMUNS
  'cunha', 'azevedo', 'fonseca', 'vargas', 'fagundes', 'ramalho', 'azevedo',
  'diniz', 'neves', 'valente', 'guimarães', 'maciel', 'damasceno', 'nogueira',
  'vilela', 'xavier', 'meireles', 'macedo', 'viegas', 'cavalcanti', 'coelho',
  'figueira', 'motta', 'parente', 'pimentel', 'castilho', 'caputo', 'goulart',
  'bittencourt', 'brito', 'franco', 'serra', 'capixaba', 'mota', 'lopez', 'guerra',
  'ramalho', 'amaral', 'romero', 'braga', 'barreto', 'ponte', 'falcão', 'assunção',
  'passos', 'salazar', 'valadares', 'menezes', 'peixoto', 'prado', 'coimbra',
  'campos', 'parreira', 'junior', 'filho', 'neto', 'sobrinho', 'junqueira',
  'figueiredo', 'meneses', 'cunha', 'queiroz', 'faustino', 'tavares', 'porto',
  'meira', 'gama', 'hoed', 'serafim', 'roza', 'rosa', 'oliveira lima', 'costa filho',
  'pontes', 'gama', 'barcelos', 'caputo', 'maria', 'moreno', 'gomes da silva',
  'henrique', 'nunes', 'santana', 'barroso', 'vilar', 'gondim', 'campos', 'damasceno',

  // COMPOSTOS E PREFIXADOS
  'da mata', 'do vale', 'das neves', 'do carmo', 'de jesus', 'do nascimento',
  'dos anjos', 'da gloria', 'de lima', 'de azevedo', 'da luz', 'da costa',
  'do rosario', 'de faria', 'de brito', 'de castilho', 'da fonseca', 'de freitas',
  'da rocha', 'do couto', 'de souza filho', 'de oliveira filho',

  // NOMES INTERNACIONALIZADOS (comuns no BR)
  'allan', 'andrew', 'brandon', 'brian', 'cristian', 'jonathan', 'kevin',
  'willian', 'patrick', 'robin', 'wesley', 'danilo', 'emily', 'stephanie',
  'nicole', 'vanessa', 'jessica', 'caroline', 'karen', 'tamiris', 'aline',
  'rebeca', 'taylor', 'victor', 'valter', 'thiago', 'alexandre', 'heitor',

  // RAROS MAS RECORRENTES EM KYC / DOCS
  'dos reis', 'da luz', 'de hollanda', 'de azevedo', 'de queiroz', 'de moura',
  'do amaral', 'de castilho', 'de lima', 'de araújo', 'de bastos', 'de bastos',
  'de oliveira', 'de freitas', 'de lima', 'de andrade', 'da conceição', 'dos santos'
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
    setHasTargetName(null); // renomeado
    if (!receipt) return;

    setOcrLoading(true);
    let cancelled = false;

    async function extractName() {
      if (!receipt) return;
      try {
        // Acumular logs para exibir no final
        let debugLogs: string[] = [];
        
        // Função para limpar caracteres não alfabéticos de um nome
        function cleanName(name: string): string {
          // Remove caracteres não alfabéticos, mas mantém espaços e apóstrofos
          const cleaned = name.replace(/[^A-Za-zÀ-ú\s']/g, ' ')
                             .replace(/\s+/g, ' ') // Substitui múltiplos espaços por um único espaço
                             .trim();
          return cleaned;
        }
        
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
        
        // Log completo para depuração
        debugLogs.push("TEXTO OCR COMPLETO:");
        lines.forEach((l, i) => debugLogs.push(`${i+1}: "${l}"`));

        // NOVO: verificar se "TCR FINANCE" aparece em alguma linha (case-insensitive)
        const hasTargetNameLocal = normalizedLines.some(line => line.includes('tcr finance') || line.includes('fraguismo') || line.includes('ttf finance') || line.includes('ter finance')); 
        setHasTargetName(hasTargetNameLocal);
        if (onTargetNameCheck) onTargetNameCheck(hasTargetNameLocal);
        // log para debug
        // debugLogs.push(`TCR FINANCE detectado: ${hasTargetNameLocal ? "SIM" : "NÃO"}`);

        // Regex para detectar CNPJ/CPF/números longos
        const cpfCnpjRegex = /\b(\d{3}\.?\d{3}\.?\d{3}-?\d{2}|\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}|\d{11,})\b/;

        // PRIMEIRO MÉTODO: Verificar linhas que contenham nomes comuns
        debugLogs.push("\nMÉTODO 1: Busca por nomes comuns");
        const commonNameCandidates = lines.filter((line, idx) => {
          const lineLower = line.toLowerCase();
          const words = lineLower.split(/\s+/);
          
          // Verificar se contém algum nome comum
          const hasCommonName = words.some(word => {
            // Limpar a palavra antes de verificar se é um nome comum
            const cleanedWord = word.replace(/[^a-z]/g, '');
            const isCommon = cleanedWord.length > 0 && COMMON_NAMES.includes(cleanedWord);
            if (isCommon) debugLogs.push(`- Linha ${idx+1} contém nome comum: "${cleanedWord}" em "${line}"`);
            return isCommon;
          });
          
          // Deve ter pelo menos um nome comum e não deve ter palavras a serem ignoradas
          const isValid = hasCommonName && 
                line.length > 2 &&
                // Removida a verificação de caracteres não alfabéticos
                !lineLower.includes('tcr finance') &&
                !IGNORE_KEYWORDS.some(key => lineLower.includes(key)) &&
                !line.match(/\d{5,}/) &&
                !line.match(/pix|cpf|cnpj|r\$|\d{2}\/\d{2}\/\d{4}/i) &&
                !cpfCnpjRegex.test(line.replace(/[ .\-\/]/g, ''));
          
          if (hasCommonName && !isValid) {
            debugLogs.push(`- ❌ REJEITADO nome comum "${line}" porque: ${
              IGNORE_KEYWORDS.some(key => lineLower.includes(key))
                ? 'contém palavra-chave para ignorar'
                : lineLower.includes('tcr finance')
                  ? 'contém TCR FINANCE'
                  : line.match(/\d{5,}/) || cpfCnpjRegex.test(line.replace(/[ .\-\/]/g, ''))
                    ? 'contém números longos'
                    : 'outra razão'
            }`);
          }
          
          return isValid;
        });
        
        // Se encontrou candidatos com nomes comuns, use o mais longo
        if (commonNameCandidates.length > 0) {
          // Ordenar por comprimento do texto sem considerar caracteres especiais
          const selectedName = commonNameCandidates.sort((a, b) => 
            b.replace(/[^A-Za-zÀ-ú]/g, '').length - 
            a.replace(/[^A-Za-zÀ-ú]/g, '').length
          )[0];
          
          foundName = cleanName(selectedName); // Limpar o nome antes de salvá-lo
          debugLogs.push(`- ✅ Encontrou nome com base em nomes comuns: "${foundName}"`);
        } else {
          debugLogs.push("- Nenhum nome comum válido encontrado");
        }

        // SEGUNDO MÉTODO: Buscar linha após qualquer palavra-chave do pagador
        if (!foundName) {
          debugLogs.push("\nMÉTODO 2: Busca após palavras-chave de pagador");
          
          // Verificar todas as linhas para cada palavra-chave do pagador
          let payerLineFound = false;
          
          // Primeiro procurar por palavras-chave de alta prioridade
          const searchPriorities = [HIGH_PRIORITY_KEYWORDS, MEDIUM_PRIORITY_KEYWORDS, LOW_PRIORITY_KEYWORDS];
          
          // Função para verificar se uma palavra-chave está em um contexto válido
          const isValidKeywordContext = (line: string, keyword: string) => {
            const lowerLine = line.toLowerCase();
            const lowerKeyword = keyword.toLowerCase();
            
            // Verificações especiais para palavras comuns que podem causar falsos positivos
            if (keyword === 'de') {
              // Rejeitar "de" em contextos comuns que não indicam pagador
              const invalidContexts = [
                'comprovante de', 'recibo de', 'impressão de', 'cópia de', 
                'opção de', 'valor de', 'taxa de', 'código de'
              ];
              
              return !invalidContexts.some(ctx => lowerLine.includes(ctx));
            }
            
            // Para outras palavras-chave, apenas verificar se elas existem na linha
            return lowerLine.includes(lowerKeyword);
          };
          
          // Procurar por cada nível de prioridade
          searchLoop: for (const priorityList of searchPriorities) {
            for (let i = 0; i < normalizedLines.length; i++) {
              const line = normalizedLines[i];
              const originalLine = lines[i];
              
              // Encontrar qual palavra-chave está presente nesta linha
              const matchedKeyword = priorityList.find(keyword => isValidKeywordContext(line, keyword));
              
              if (matchedKeyword) {
                debugLogs.push(`- Encontrou palavra-chave "${matchedKeyword}" na linha ${i+1}: "${originalLine}"`);
                payerLineFound = true;
                
                // Verificar se a linha contém "Nome:" ou algo similar seguido por um nome
                const nameMatch = originalLine.match(/nome\s*[:\-]?\s*([A-Za-zÀ-ú\s'.]+)$/i);
                if (nameMatch && nameMatch[1] && nameMatch[1].trim().length > 2) {
                  const extractedName = nameMatch[1].trim();
                  if (!IGNORE_KEYWORDS.some(key => extractedName.toLowerCase().includes(key)) &&
                      !extractedName.match(/\d{5,}/) &&
                      !extractedName.toLowerCase().includes('tcr finance')) {
                    foundName = cleanName(extractedName);
                    debugLogs.push(`  - ✅ Nome extraído da mesma linha: "${foundName}"`);
                    break searchLoop;
                  }
                }
                
                // Verificar se há um nome na mesma linha, após a palavra-chave
                const keywordPos = originalLine.toLowerCase().indexOf(matchedKeyword.toLowerCase());
                if (keywordPos !== -1 && originalLine.length > keywordPos + matchedKeyword.length + 3) {
                  const namePart = originalLine.substring(keywordPos + matchedKeyword.length).trim();
                  
                  // Verificar se o texto após a palavra-chave parece um nome válido
                  if (namePart.length > 2 && 
                      !IGNORE_KEYWORDS.some(key => namePart.toLowerCase().includes(key)) &&
                      !namePart.match(/\d{5,}/) &&
                      !namePart.toLowerCase().includes('tcr finance')) {
                    
                    foundName = cleanName(namePart);
                    debugLogs.push(`  - ✅ Nome encontrado na mesma linha após a palavra-chave: "${foundName}"`);
                    break searchLoop;
                  }
                }
                
                // Procurar por "Nome:" na próxima linha
                if (i + 1 < lines.length) {
                  const nextLine = lines[i + 1];
                  const nextLineLower = nextLine.toLowerCase();
                  
                  debugLogs.push(`  - Verificando linha seguinte ${i+2}: "${nextLine}"`);
                  
                  // Verificar se a linha seguinte começa com "Nome:" ou contém um padrão de nome
                  const nextLineNameMatch = nextLine.match(/^nome\s*[:\-]?\s*([A-Za-zÀ-ú\s'.]+)$/i);
                  if (nextLineNameMatch && nextLineNameMatch[1] && nextLineNameMatch[1].trim().length > 2) {
                    const extractedName = nextLineNameMatch[1].trim();
                    if (!IGNORE_KEYWORDS.some(key => extractedName.toLowerCase().includes(key)) &&
                        !extractedName.match(/\d{5,}/) &&
                        !extractedName.toLowerCase().includes('tcr finance')) {
                      foundName = cleanName(extractedName);
                      debugLogs.push(`  - ✅ Nome extraído da linha com "Nome:": "${foundName}"`);
                      break searchLoop;
                    }
                  }
                  // Se a próxima linha parece ser um nome válido sem indicadores
                  else if (nextLine.length > 2 && 
                      !IGNORE_KEYWORDS.some(key => nextLineLower.includes(key)) &&
                      !nextLine.match(/\d{5,}/) &&
                      !nextLineLower.includes('tcr finance')) {
                    
                    foundName = cleanName(nextLine);
                    debugLogs.push(`  - ✅ Nome encontrado na linha seguinte: "${foundName}"`);
                    break searchLoop;
                  } 
                  // Verificar linha após a próxima
                  else if (i + 2 < lines.length) {
                    const lineAfterNext = lines[i + 2];
                    const lineAfterNextLower = lineAfterNext.toLowerCase();
                    
                    debugLogs.push(`  - Verificando segunda linha seguinte ${i+3}: "${lineAfterNext}"`);
                    
                    if (lineAfterNext.length > 2 &&
                        !IGNORE_KEYWORDS.some(key => lineAfterNextLower.includes(key)) &&
                        !lineAfterNext.match(/\d{5,}/) &&
                        !lineAfterNextLower.includes('tcr finance')) {
                      
                      foundName = cleanName(lineAfterNext);
                      debugLogs.push(`  - ✅ Nome encontrado na segunda linha seguinte: "${foundName}"`);
                      break searchLoop;
                    }
                  }
                }
              }
            }
          }
          
          if (!payerLineFound) {
            debugLogs.push("- Nenhuma palavra-chave de pagador válida encontrada");
          }
        }
        
        // Se não encontrou com base nos métodos acima, continue com os outros métodos
        if (!foundName) {
          debugLogs.push("\nMÉTODO 3: Busca específica Mercado Pago");
          // Busca específica do Mercado Pago: "e De" seguido de nome
          for (let i = 0; i < normalizedLines.length; i++) {
            const line = normalizedLines[i];
            if (line === 'e de' || line === 'de') {
              debugLogs.push(`- Encontrou "${line}" na linha ${i+1}`);
              // Olha a próxima linha não vazia
              for (let j = i + 1; j < lines.length; j++) {
                if (lines[j].trim()) {
                  const candidate = lines[j];
                  const candidateLower = candidate.toLowerCase();
                  
                  debugLogs.push(`- Avaliando linha ${j+1} como nome: "${candidate}"`);
                  
                  // Verificar se a linha candidata é uma das palavras-chave para ignorar
                  if (!IGNORE_KEYWORDS.some(key => candidateLower.includes(key)) &&
                      candidate.length > 2 &&
                      /^[A-Za-zÀ-ú\s*]+$/.test(candidate) &&
                      !candidateLower.includes('tcr finance') &&
                      !candidate.match(/\d{5,}/) &&
                      !cpfCnpjRegex.test(candidate.replace(/[ .\-\/]/g, ''))) {
                    foundName = candidate;
                    debugLogs.push(`- ✅ ACEITO como nome: "${foundName}"`);
                    break;
                  } else {
                    debugLogs.push(`- ❌ REJEITADO: ${
                      IGNORE_KEYWORDS.some(key => candidateLower.includes(key))
                        ? 'contém palavra-chave para ignorar'
                        : !(/^[A-Za-zÀ-ú\s*]+$/.test(candidate))
                          ? 'contém caracteres não alfabéticos'
                          : candidateLower.includes('tcr finance')
                            ? 'contém TCR FINANCE'
                            : candidate.match(/\d{5,}/) || cpfCnpjRegex.test(candidate.replace(/[ .\-\/]/g, ''))
                              ? 'contém números'
                              : 'outra razão'
                    }`);
                  }
                }
              }
              if (foundName) break;
            }
          }
        }

        // Se não encontrou com o padrão do Mercado Pago, continua com os outros métodos
        // Nova busca: se encontrar "origem", pega o próximo "nome" e depois a próxima linha válida
        if (!foundName) {
          debugLogs.push("\nMÉTODO 4: Busca por 'origem' seguida de 'nome'");
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
                    !cpfCnpjRegex.test(candidate.replace(/[ .\-\/]/g, '')) &&
                    !candidateLower.includes('tcr finance')
                  ) {
                    const processedCandidate = candidate.replace(/^nome[:\s]+/i, '').trim();
                    if (processedCandidate.length >= 3) {
                      foundName = processedCandidate;
                      debugLogs.push(`- ✅ Encontrado como nome: "${foundName}"`);
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
          debugLogs.push("\nMÉTODO 5: Busca padrão por palavras-chave");
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
                  !cpfCnpjRegex.test(candidate.replace(/[ .\-\/]/g, '')) &&
                  !candidateLower.includes('tcr finance')
                ) {
                  foundName = candidate;
                  debugLogs.push(`- ✅ Encontrado como nome: "${foundName}"`);
                  break;
                }
              }
              if (foundName) break;
            }
          }
        }

        // Fallback: pega o nome mais próximo de um nome comum (até 2 caracteres de diferença)
        if (!foundName) {
          debugLogs.push("\nFALLBACK: Busca por similaridade com nomes comuns");
          const fallbackCandidates = lines.filter(line =>
            /^[A-ZÀ-Ú\s*]{5,}$/.test(line) &&
            line.replace(/[^A-Za-zÀ-ú*]/g, '').replace(/\*/g, '').length >= 3 &&
            !IGNORE_KEYWORDS.some(k => line.toLowerCase().includes(k)) &&
            !line.toLowerCase().includes('estamos aqui para ajudar') &&
            !line.match(/\d{5,}/) &&
            !line.match(/pix|cpf|cnpj|r\$|\d{2}\/\d{2}\/\d{4}/i) &&
            !cpfCnpjRegex.test(line.replace(/[ .\-\/]/g, '')) &&
            !line.toLowerCase().includes('tcr finance')
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
            debugLogs.push(`- ✅ Encontrado por similaridade: "${foundName}"`);
          } else {
            foundName = fallbackCandidates.sort((a, b) =>
              b.replace(/[^A-Za-zÀ-ú*]/g, '').replace(/\*/g, '').length - a.replace(/[^A-ZaZÀ-ú*]/g, '').replace(/\*/g, '').length
            )[0] || '';
            debugLogs.push(`- Selecionado maior nome do fallback: "${foundName}"`);
          }
        }

        // Verificação adicional: se o nome encontrado contém palavras para ignorar, descarta
        if (foundName) {
          const foundNameLower = foundName.toLowerCase();
          if (IGNORE_KEYWORDS.some(key => foundNameLower.includes(key))) {
            debugLogs.push(`- ❌ REJEITADO: "${foundName}" contém palavra-chave para ignorar`);
            foundName = '';
          }
        }

        // Se ainda não achou, pega a primeira linha não vazia com pelo menos 3 letras e só letras/espaços
        if (!foundName) {
          debugLogs.push("\nMÉTODO 6: Selecionar primeira linha válida");
          const candidates = lines.filter(line => {
            const lineLower = line.toLowerCase();
            return line.replace(/[^A-Za-zÀ-ú*]/g, '').replace(/\*/g, '').length >= 3 &&
              /^[A-Za-zÀ-ú\s*]+$/.test(line) &&
              !lineLower.includes('tcr finance') &&
              !IGNORE_KEYWORDS.some(key => lineLower.includes(key))
          });
          
          foundName = candidates.sort((a, b) =>
            b.replace(/[^A-Za-zÀ-ú*]/g, '').replace(/\*/g, '').length - a.replace(/[^A-Za-zÀ-ú*]/g, '').replace(/\*/g, '').length
          )[0] || '';
          debugLogs.push(`- Selecionado como nome: "${foundName}"`);
        }

        // Nunca aceitar a frase indesejada como sugestão
        if (
          foundName &&
          foundName.trim().toLowerCase() === 'estamos aqui para ajudar se você tiver alguma'
        ) {
          foundName = '';
          debugLogs.push(`- ❌ REJEITADO: "${foundName}" é uma frase indesejada`);
        }

        // ETAPA EXTRA: se a sugestão final ainda contiver "TCR FINANCE", buscar a primeira linha que contenha um common name completo
        if (foundName && foundName.toLowerCase().includes('tcr finance')) {
          // debugLogs.push(`- TCR FINANCE detectado em "${foundName}", buscando nome alternativo...`);
          const commonCandidates = lines.filter(line => {
            const words = line.toLowerCase().split(/\s+/);
            return words.some(word => COMMON_NAMES.includes(word)) && !line.toLowerCase().includes('tcr finance');
          });
          if (commonCandidates.length > 0) {
            foundName = commonCandidates.sort((a, b) => b.length - a.length)[0];
            // debugLogs.push(`- ✅ Nome alternativo encontrado: "${foundName}"`);
          } else {
            foundName = 'Nome não identificado';
            // debugLogs.push(`- ❌ Nenhum nome alternativo encontrado, definido como "Nome não identificado"`);
          }
        }

        // Se ainda não achou nada, define como "Nome não identificado"
        if (!foundName) {
          debugLogs.push("\nNenhum método encontrou um nome válido!");
          foundName = 'Nome não identificado';
        }

        // Exibir todos os logs acumulados de uma vez
        console.log(debugLogs.join("\n"));

        if (!cancelled) {
          // Fazer uma limpeza final no nome encontrado
          if (foundName) {
            foundName = cleanName(foundName);
          }
          
          setSuggestedName(foundName);
          
          // Chamar o callback se fornecido
          if (onNameDetected && foundName) {
            onNameDetected(foundName);
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Erro ao processar OCR:", error);
          setSuggestedName('Nome não identificado');
          setHasTargetName(null); // renomeado
        }
      } finally {
        if (!cancelled) setOcrLoading(false);
      }
    }

    extractName();
    return () => { cancelled = true; };
  }, [receipt, onNameDetected, onTargetNameCheck]);

  return (
    <div className="text-xs text-muted-foreground mt-1 min-h-[18px]">
      {ocrLoading
        ? "Procurando nome no comprovante..."
        : (
          <span>
            Nome identificado pelo OCR:{" "}
            <span className="font-semibold">
              {suggestedName}
            </span>
          </span>
        )
      }
    </div>
  );
}

