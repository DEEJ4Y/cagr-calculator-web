import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import xirr from 'xirr';

function useCalculatedXirr() {
  const [xirrValue, setXirr] = useState(0);
  const router = useRouter();

  useEffect(() => {
    recalculateXirr([]);
  }, [router.pathname]);

  const resetTrades = () => {
    localStorage.setItem('allTrades', '[]');
    setXirr(0);
  };

  const recalculateXirr = (newTrades = []) => {
    const allTrades = [];

    const storedTradesJson = localStorage.getItem('allTrades');

    if (storedTradesJson) {
      const storedTrades = JSON.parse(storedTradesJson);
      allTrades.push(...storedTrades);
    }
    allTrades.push(...newTrades);

    const holdings = {};
    const exitedTrades = {};

    allTrades.forEach(
      ({ symbol, trade_type, quantity, price, order_execution_time }) => {
        if (!order_execution_time) console.log(symbol);

        order_execution_time = order_execution_time.split('\n').join('');
        if (trade_type === 'buy') {
          if (holdings[symbol]) {
            const oldHoldingData = holdings[symbol];

            const thisSymbolTrades = oldHoldingData.trades;

            for (let i = 0; i < quantity; i++) {
              thisSymbolTrades.push({
                price,
                order_execution_time: new Date(order_execution_time),
              });
            }

            holdings[symbol] = {
              quantity: thisSymbolTrades.length,
              price:
                thisSymbolTrades.reduce((a, b) => a + b.price, 0) /
                thisSymbolTrades.length,
              trades: thisSymbolTrades,
            };
          } else {
            const thisSymbolTrades = [];

            for (let i = 0; i < quantity; i++) {
              thisSymbolTrades.push({
                price,
                order_execution_time: new Date(order_execution_time),
              });
            }

            holdings[symbol] = {
              quantity,
              price:
                thisSymbolTrades.reduce((a, b) => a + b.price, 0) /
                thisSymbolTrades.length,
              trades: thisSymbolTrades,
            };
          }
        } else if (trade_type === 'sell') {
          if (holdings[symbol]) {
            const oldHoldingData = holdings[symbol];

            const thisSymbolTrades = oldHoldingData.trades;

            const oldBuyingPrices = [];

            for (let i = 0; i < quantity; i++) {
              const shifted = thisSymbolTrades.shift();
              if (shifted && shifted.price)
                oldBuyingPrices.push({
                  buy: shifted.price,
                  buy_order_execution_time: shifted.order_execution_time,
                  sell: price,
                  sell_order_execution_time: new Date(order_execution_time),
                  gain: price - shifted.price,
                });
            }

            if (exitedTrades[symbol]) {
              exitedTrades[symbol].push(...oldBuyingPrices);
            } else {
              exitedTrades[symbol] = oldBuyingPrices;
            }

            if (thisSymbolTrades.length === 0) {
              delete holdings[symbol];
            } else {
              holdings[symbol] = {
                quantity: thisSymbolTrades.length,
                price:
                  thisSymbolTrades.reduce((a, b) => a + b.price, 0) /
                  thisSymbolTrades.length,
                trades: thisSymbolTrades,
              };
            }
          }
        }
      }
    );

    const allExitedTrades = [];
    Object.values(exitedTrades).forEach((exitedTradeArray) => {
      allExitedTrades.push(...exitedTradeArray);
    });
    // Extract relevant data for XIRR calculation
    let cashFlows = [];

    allExitedTrades.forEach(
      ({ buy, sell, buy_order_execution_time, sell_order_execution_time }) => {
        const buyDate = new Date(buy_order_execution_time);
        const sellDate = new Date(sell_order_execution_time);

        const buyCashFlow = {
          when: buyDate,
          amount: -1 * buy,
        };
        const sellCashFlow = {
          when: sellDate,
          amount: sell,
        };
        cashFlows.push(buyCashFlow);
        cashFlows.push(sellCashFlow);
      }
    );

    cashFlows.sort((a, b) => (a.when.getTime() <= b.when.getTime() ? -1 : 1));

    const newXirrValue = cashFlows.length > 2 ? xirr(cashFlows) : 0;
    console.log(`XIRR (All Time): ${(100 * newXirrValue).toFixed(2)}%`);

    localStorage.setItem('allTrades', JSON.stringify(allTrades, null, 4));
    setXirr(newXirrValue);
  };

  return [xirrValue, recalculateXirr, resetTrades];
}

export default useCalculatedXirr;
