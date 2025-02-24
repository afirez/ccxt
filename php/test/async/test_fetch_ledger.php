<?php
namespace ccxt;
use \ccxt\Precise;
use React\Async;
use React\Promise;

// ----------------------------------------------------------------------------

// PLEASE DO NOT EDIT THIS FILE, IT IS GENERATED AND WILL BE OVERWRITTEN:
// https://github.com/ccxt/ccxt/blob/master/CONTRIBUTING.md#how-to-contribute-code

// -----------------------------------------------------------------------------
include_once __DIR__ . '/../base/test_shared_methods.php';
include_once __DIR__ . '/../base/test_ledger_entry.php';

function test_fetch_ledger($exchange, $code) {
    return Async\async(function () use ($exchange, $code) {
        $method = 'fetchLedger';
        $items = Async\await($exchange->fetch_ledger($code));
        assert(gettype($items) === 'array' && array_keys($items) === array_keys(array_keys($items)), $exchange->id . ' ' . $method . ' ' . $code . ' must return an array. ' . $exchange->json($items));
        $now = $exchange->milliseconds();
        for ($i = 0; $i < count($items); $i++) {
            test_ledger_entry($exchange, $method, $items[$i], $code, $now);
        }
        assert_timestamp_order($exchange, $method, $code, $items);
    }) ();
}
