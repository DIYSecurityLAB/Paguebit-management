import { useState } from 'react';
import { Download } from 'lucide-react';
import Button from './Button';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

interface ExcelExportProps {
  onExport: () => Promise<any>;
  filename?: string;
  sheetName?: string;
  buttonText?: string;
  className?: string;
  transformData?: (data: any) => any[];
  columnWidths?: { [key: string]: number };
  headerStyle?: {
    backgroundColor?: string;
    fontColor?: string;
    fontSize?: number;
    bold?: boolean;
  };
}

export default function ExcelExport({
  onExport,
  filename = 'export',
  sheetName = 'Sheet1',
  buttonText = 'Exportar para Excel',
  className,
  transformData,
  columnWidths,
  headerStyle = {
    backgroundColor: '2F75B5',
    fontColor: 'FFFFFF',
    fontSize: 12,
    bold: true
  }
}: ExcelExportProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      toast.info("Preparando relatório estilizado...");
      
      // Obter dados
      const response = await onExport();
      console.log('Dados recebidos para exportação:', response);
      
      // Verificar e processar dados
      let exportData = Array.isArray(response) ? response : response?.data || [];
      
      if (!Array.isArray(exportData) || exportData.length === 0) {
        toast.warning('Não há dados disponíveis para exportação');
        return;
      }
      
      // Aplicar transformação
      if (transformData) {
        exportData = transformData(exportData);
      }
      
      // Extrair nomes de colunas do primeiro objeto
      const headers = Object.keys(exportData[0]);
      
      // Criar a worksheet e configurações básicas
      const worksheet = XLSX.utils.json_to_sheet(exportData, {
        header: headers,
        skipHeader: true // Vamos adicionar cabeçalhos estilizados manualmente
      });
      
      // Inicializar o workbook
      const workbook = XLSX.utils.book_new();
      
      // Definir a largura das colunas
      const defaultColumnWidth = 15;
      worksheet['!cols'] = headers.map(header => ({ 
        wch: columnWidths?.[header] || defaultColumnWidth 
      }));
      
      // Determinar a última coluna
      const lastCol = XLSX.utils.encode_col(headers.length - 1);
      const lastRow = exportData.length + 1; // +1 para o cabeçalho
      
      // Adicionar formato estilizado aos cabeçalhos
      headers.forEach((header, index) => {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c: index });
        
        // Criar a célula se não existir
        if (!worksheet[cellRef]) {
          worksheet[cellRef] = { v: header, t: 's' };
        } else {
          worksheet[cellRef].v = header;
        }
        
        // Adicionar estilo ao cabeçalho (usando comentários especiais para Excel entender)
        // Isso vai aplicar só uma cor de fundo, que Excel pode entender
        if (headerStyle.backgroundColor) {
          // O Excel vai interpretar isso quando abrir o arquivo
          worksheet[cellRef].s = {
            fill: { fgColor: { rgb: headerStyle.backgroundColor } },
            font: { 
              bold: headerStyle.bold,
              color: { rgb: headerStyle.fontColor || '000000' },
              sz: headerStyle.fontSize || 12
            },
            alignment: { horizontal: 'center', vertical: 'center', wrapText: true }
          };
        }
      });
      
      // Inserir dados com valores formatados
    interface CellStyle {
        alignment?: {
            vertical?: string;
            horizontal?: string;
            wrapText?: boolean;
        };
        fill?: {
            fgColor: { rgb: string };
        };
        border?: {
            top?: { style: string; color: { rgb: string } };
            bottom?: { style: string; color: { rgb: string } };
            left?: { style: string; color: { rgb: string } };
            right?: { style: string; color: { rgb: string } };
        };
        font?: {
            name?: string;
            sz?: number;
            bold?: boolean;
            color?: { rgb: string };
        };
    }

    type RowData = { [key: string]: any };

    exportData.forEach((row: RowData, rowIndex: number) => {
        headers.forEach((header: string, colIndex: number) => {
            const cellRef: string = XLSX.utils.encode_cell({ r: rowIndex + 1, c: colIndex }); // +1 porque r0 é o cabeçalho

            // Adicionar estilos de zebra (linhas alternadas)
            let cellStyle: CellStyle = {
                alignment: { vertical: 'center' }
            };

            // Listras zebra (linhas alternadas)
            if (rowIndex % 2 === 1) {
                cellStyle.fill = { fgColor: { rgb: 'F2F2F2' } }; // Cinza claro para linhas alternadas
            }

            // Adicionar bordas finas para todas as células
            cellStyle.border = {
                top: { style: 'thin', color: { rgb: 'E0E0E0' } },
                bottom: { style: 'thin', color: { rgb: 'E0E0E0' } },
                left: { style: 'thin', color: { rgb: 'E0E0E0' } },
                right: { style: 'thin', color: { rgb: 'E0E0E0' } }
            };

            // Aplicar estilos específicos para tipos de dados
            const value: any = row[header];

            // Para células de texto longo, habilitar quebra de texto
            if (typeof value === 'string' && value.length > 20) {
                if (!cellStyle.alignment) cellStyle.alignment = {};
                cellStyle.alignment.wrapText = true;
            }

            // Para endereços de carteira, usar fonte menor e monoespaçada
            if (header.includes('Carteira')) {
                cellStyle.font = { name: 'Consolas', sz: 9 };
            }

            if (worksheet[cellRef]) {
                (worksheet[cellRef] as XLSX.CellObject & { s?: CellStyle }).s = cellStyle;
            }
        });
    });
      
      // Definir o range da tabela
      worksheet['!ref'] = `A1:${lastCol}${lastRow}`;
      
      // Adicionar auto-filtro ao cabeçalho
      worksheet['!autofilter'] = { ref: `A1:${lastCol}1` };
      
      // Adicionar a planilha ao workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      
      // Criar data para o nome do arquivo
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
      const fullFilename = `${filename}_${dateStr}_${timeStr}.xlsx`;
      
      // Salvar o arquivo
      XLSX.writeFile(workbook, fullFilename);
      
      toast.success('Relatório estilizado exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar para Excel:', error);
      toast.error('Falha ao exportar dados');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      leftIcon={<Download className="h-4 w-4" />}
      isLoading={isExporting}
      disabled={isExporting}
      className={className}
    >
      {isExporting ? 'Exportando...' : buttonText}
    </Button>
  );
}
