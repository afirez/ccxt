
import assert from 'assert';
import testSharedMethods from './base/test.sharedMethods.js';
import testTrade from './base/test.trade.js';

async function testFetchMyTrades (exchange, symbol) {
    const method = 'fetchMyTrades';
    const trades = await exchange.fetchMyTrades (symbol);
    assert (Array.isArray (trades), exchange.id + ' ' + method + ' ' + symbol + ' must return an array. ' + exchange.json (trades));
    const now = exchange.milliseconds ();
    for (let i = 0; i < trades.length; i++) {
        testTrade (exchange, method, trades[i], symbol, now);
    }
    testSharedMethods.assertTimestampOrder (exchange, method, symbol, trades);
}

export default testFetchMyTrades;
