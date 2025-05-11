import { useEffect, useState } from 'react';

export function useWithdrawalFees(
  amount: number,
  walletType: string,
  hasCoupon: boolean = false
) {
  const [btcToBrl, setBtcToBrl] = useState<number | null>(null);
  const [usdtToBrl, setUsdtToBrl] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,tether&vs_currencies=brl'
        );
        if (!response.ok) {
          throw new Error('Falha ao buscar cotações. Tente novamente mais tarde.');
        }
        const data = await response.json();
        setBtcToBrl(data.bitcoin?.brl || null);
        setUsdtToBrl(data.tether?.brl || null);

        if (!data.bitcoin?.brl || !data.tether?.brl) {
          throw new Error('Cotações incompletas recebidas da API.');
        }
      } catch (error: unknown) {
        console.error('Erro ao buscar cotações:', error);
        setError(error instanceof Error ? error.message : 'Erro desconhecido ao buscar cotações.');
        setBtcToBrl(null);
        setUsdtToBrl(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [walletType]);

  // Taxa da plataforma
  const alfredFeeRate = hasCoupon ? 0.0399 : 0.0399;
  const alfredFee = amount * alfredFeeRate;
  const finalAmountBRL = amount - alfredFee;

  // Definição dos tipos de carteira
  const isBitcoinWallet = ['onchainaddress', 'lightningaddress', 'liquidaddress'].includes(
    walletType.toLowerCase()
  );

  const isUsdtWallet = ['tronaddress', 'polygonaddress'].includes(
    walletType.toLowerCase()
  );

  // Taxas de spread para cada criptomoeda
  const btcSpreadRate = 0.025; // 2.5% para Bitcoin
  const usdtSpreadRate = 0.025; // 2.5% para USDT (igual a do Bitcoin)

  // BTC calculations - aplicando taxa de spread de 2.5%
  const adjustedBtcRate = btcToBrl ? btcToBrl * (1 - btcSpreadRate) : null;
  const expectedAmountBTC = isBitcoinWallet && adjustedBtcRate
    ? (finalAmountBRL / adjustedBtcRate).toFixed(8)
    : '0.00000000';

  // USDT calculations - aplicando taxa de spread de 2.5%
  const adjustedUsdtRate = usdtToBrl ? usdtToBrl * (1 - usdtSpreadRate) : null;
  const expectedAmountUSDT = isUsdtWallet && adjustedUsdtRate
    ? (finalAmountBRL / adjustedUsdtRate).toFixed(2)
    : '0.00';

  const totalFees = alfredFee;

  return {
    loading,
    error,
    btcToBrl: adjustedBtcRate,
    usdtToBrl: adjustedUsdtRate,
    alfredFee,
    alfredFeeRate,
    totalFees,
    finalAmountBRL,
    expectedAmountBTC,
    expectedAmountUSDT,
    isBitcoinWallet,
    isUsdtWallet,
    btcSpreadRate,
    usdtSpreadRate,
  };
}
