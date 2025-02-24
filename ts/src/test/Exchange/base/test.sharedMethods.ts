
import assert from 'assert';
import Precise from '../../../base/Precise.js';

function logTemplate (exchange, method, entry) {
    return ' <<< ' + exchange.id + ' ' + method + ' ::: ' + exchange.json (entry) + ' >>> ';
}

function assertType (exchange, entry, key, format) {
    // because "typeof" string is not transpilable without === 'name', we list them manually at this moment
    const entryKeyVal = exchange.safeValue (entry, key);
    const formatKeyVal = exchange.safeValue (format, key);
    const same_string = (typeof entryKeyVal === 'string') && (typeof formatKeyVal === 'string');
    const same_numeric = (typeof entryKeyVal === 'number') && (typeof formatKeyVal === 'number');
    // todo: the below is correct, but is not being transpiled into python correctly: (x == False) instead of (x is False)
    // const same_boolean = ((entryKeyVal === true) || (entryKeyVal === false)) && ((formatKeyVal === true) || (formatKeyVal === false));
    const same_boolean = ((entryKeyVal || !entryKeyVal) && (formatKeyVal || !formatKeyVal));
    const same_array = Array.isArray (entryKeyVal) && Array.isArray (formatKeyVal);
    const same_object = (typeof entryKeyVal === 'object') && (typeof formatKeyVal === 'object');
    const result = (entryKeyVal === undefined) || same_string || same_numeric || same_boolean || same_array || same_object;
    return result;
}

function assertStructure (exchange, method, entry, format, emptyNotAllowedFor = []) {
    const logText = logTemplate (exchange, method, entry);
    assert (entry, 'item is null/undefined' + logText);
    // get all expected & predefined keys for this specific item and ensure thos ekeys exist in parsed structure
    if (Array.isArray (format)) {
        assert (Array.isArray (entry), 'entry is not an array' + logText);
        const realLength = entry.length;
        const expectedLength = format.length;
        assert (realLength === expectedLength, 'entry length is not equal to expected length of ' + expectedLength.toString () + logText);
        for (let i = 0; i < format.length; i++) {
            const is_in_array = exchange.inArray (i, emptyNotAllowedFor);
            if (is_in_array) {
                assert ((entry[i] !== undefined), i.toString () + ' index is undefined, but is is was expected to be set' + logText);
            }
            // because of other langs, this is needed for arrays
            assert (assertType (exchange, entry, i, format), i.toString () + ' index does not have an expected type ' + logText);
        }
    } else {
        assert (typeof entry === 'object', 'entry is not an object' + logText);
        const keys = Object.keys (format);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const keyStr = key.toString ();
            assert ((key in entry), keyStr + ' key is missing from structure' + logText);
            if (exchange.inArray (key, emptyNotAllowedFor)) {
                // if it was in needed keys, then it should have value.
                assert (entry[key] !== undefined, key + ' key has an null value, but is expected to have a value' + logText);
            }
            assert (assertType (exchange, entry, key, format), key + ' key is neither undefined, neither of expected type' + logText);
        }
    }
}

function assertTimestamp (exchange, method, entry, nowToCheck = undefined, keyName : any = 'timestamp') {
    const logText = logTemplate (exchange, method, entry);
    const isDateTimeObject = typeof keyName === 'string';
    if (isDateTimeObject) {
        assert ((keyName in entry), 'timestamp key ' + keyName + ' is missing from structure' + logText);
    } else {
        // if index was provided (mostly from fetchOHLCV) then we check if it exists, as mandatory
        assert (!(entry[keyName] === undefined), 'timestamp index ' + keyName.toString () + ' is undefined' + logText);
    }
    const ts = entry[keyName];
    if (ts !== undefined) {
        // todo: add transpilable is_integer
        assert (typeof ts === 'number', 'timestamp is not numeric' + logText);
        assert (ts > 1230940800000, 'timestamp is impossible to be before 1230940800000 / 03.01.2009' + logText); // 03 Jan 2009 - first block
        assert (ts < 2147483648000, 'timestamp more than 2147483648000 / 19.01.2038' + logText); // 19 Jan 2038 - int32 overflows // 7258118400000  -> Jan 1 2200
        if (nowToCheck !== undefined) {
            assert (ts < nowToCheck + 60000, 'trade timestamp is not below current time. Returned datetime: ' + exchange.iso8601 (ts) + ', now: ' + exchange.iso8601 (nowToCheck) + logText);
        }
    }
    // only in case if the entry is a dictionary, thus it must have 'timestamp' & 'datetime' string keys
    if (isDateTimeObject) {
        // we also test 'datetime' here because it's certain sibling of 'timestamp'
        assert (('datetime' in entry), 'datetime is missing from structure' + logText);
        const dt = entry['datetime'];
        if (dt !== undefined) {
            assert (typeof dt === 'string', 'datetime is not a string' + logText);
            assert (dt === exchange.iso8601 (entry['timestamp']), 'datetime is not iso8601 of timestamp' + logText);
        }
    }
}

function assertCurrencyCode (exchange, method, entry, actualCode, expectedCode = undefined) {
    const logText = logTemplate (exchange, method, entry);
    if (actualCode !== undefined) {
        assert (typeof actualCode === 'string', 'currency code should be either undefined or a string' + logText);
        assert ((actualCode in exchange.currencies), 'currency code should be present in exchange.currencies' + logText);
        if (expectedCode !== undefined) {
            assert (actualCode === expectedCode, 'currency code in response (' + actualCode + ') should be equal to expected code (' + expectedCode + ')' + logText);
        }
    }
}

function assertSymbol (exchange, method, entry, key, expectedSymbol = undefined) {
    const logText = logTemplate (exchange, method, entry);
    const actualSymbol = exchange.safeString (entry, key);
    if (actualSymbol !== undefined) {
        assert (typeof actualSymbol === 'string', 'symbol should be either undefined or a string' + logText);
        assert ((actualSymbol in exchange.markets), 'symbol should be present in exchange.symbols' + logText);
    }
    if (expectedSymbol !== undefined) {
        assert (actualSymbol === expectedSymbol, 'symbol in response (' + actualSymbol + ') should be equal to expected symbol (' + expectedSymbol + ')' + logText);
    }
}

function assertGreater (exchange, method, entry, key, compareTo) {
    const logText = logTemplate (exchange, method, entry);
    const value = exchange.safeString (entry, key);
    if (value !== undefined) {
        let keyStr = undefined;
        if (typeof key === 'string') {
            keyStr = key;
        } else {
            keyStr = key.toString ();
        }
        let compareToStr = undefined;
        if (typeof compareTo === 'string') {
            compareToStr = compareTo;
        } else {
            compareToStr = compareTo.toString ();
        }
        assert (Precise.stringGt (value, compareTo), keyStr + ' key (with a value of ' + value + ') was expected to be > ' + compareToStr + logText);
    }
}

function assertGreaterOrEqual (exchange, method, entry, key, compareTo) {
    const logText = logTemplate (exchange, method, entry);
    const value = exchange.safeString (entry, key);
    if (value !== undefined) {
        let keyStr = undefined;
        if (typeof key === 'string') {
            keyStr = key;
        } else {
            keyStr = key.toString ();
        }
        let compareToStr = undefined;
        if (typeof compareTo === 'string') {
            compareToStr = compareTo;
        } else {
            compareToStr = compareTo.toString ();
        }
        assert (Precise.stringGe (value, compareTo), keyStr + ' key (with a value of ' + value + ') was expected to be >= ' + compareToStr + logText);
    }
}

function assertLess (exchange, method, entry, key, compareTo) {
    const logText = logTemplate (exchange, method, entry);
    const value = exchange.safeString (entry, key);
    if (value !== undefined) {
        let keyStr = undefined;
        if (typeof key === 'string') {
            keyStr = key;
        } else {
            keyStr = key.toString ();
        }
        let compareToStr = undefined;
        if (typeof compareTo === 'string') {
            compareToStr = compareTo;
        } else {
            compareToStr = compareTo.toString ();
        }
        assert (Precise.stringLt (value, compareTo), keyStr + ' key (with a value of ' + value + ') was expected to be < ' + compareToStr + logText);
    }
}

function assertLessOrEqual (exchange, method, entry, key, compareTo) {
    const logText = logTemplate (exchange, method, entry);
    const value = exchange.safeString (entry, key);
    if (value !== undefined) {
        let keyStr = undefined;
        if (typeof key === 'string') {
            keyStr = key;
        } else {
            keyStr = key.toString ();
        }
        let compareToStr = undefined;
        if (typeof compareTo === 'string') {
            compareToStr = compareTo;
        } else {
            compareToStr = compareTo.toString ();
        }
        assert (Precise.stringLe (value, compareTo), keyStr + ' key (with a value of ' + value + ') was expected to be <= ' + compareToStr + logText);
    }
}

function assertInArray (exchange, method, entry, key, expectedArray) {
    const logText = logTemplate (exchange, method, entry);
    const value = exchange.safeValue (entry, key);
    if (value !== undefined) {
        let keyStr = undefined;
        if (typeof key === 'string') {
            keyStr = key;
        } else {
            keyStr = key.toString ();
        }
        assert (exchange.inArray (value, expectedArray), keyStr + ' key (with a value of ' + value + ') was expected to be one from: [' + expectedArray.join (',') + ']' + logText);
    }
}

function assertFee (exchange, method, entry) {
    const logText = logTemplate (exchange, method, entry);
    if (entry !== undefined) {
        assert (('cost' in entry), '"fee" should contain a "cost" key' + logText);
        assertGreaterOrEqual (exchange, method, entry, 'cost', '0');
        assert (('currency' in entry), '"fee" should contain a "currency" key' + logText);
        assertCurrencyCode (exchange, method, entry, entry['currency']);
    }
}

function assertFees (exchange, method, entry) {
    const logText = logTemplate (exchange, method, entry);
    if (entry !== undefined) {
        assert (Array.isArray (entry), '"fees" is not an array' + logText);
        for (let i = 0; i < entry.length; i++) {
            assertFee (exchange, method, entry[i]);
        }
    }
}

function assertTimestampOrder (exchange, method, codeOrSymbol, items, ascending = false) {
    for (let i = 0; i < items.length; i++) {
        if (i > 0) {
            const ascendingOrDescending = ascending ? 'ascending' : 'descending';
            const firstIndex = ascending ? i - 1 : i;
            const secondIndex = ascending ? i : i - 1;
            assert (items[firstIndex]['timestamp'] >= items[secondIndex]['timestamp'], exchange.id + ' ' + method + ' ' + codeOrSymbol + ' must return a ' + ascendingOrDescending + ' sorted array of items by timestamp. ' + exchange.json (items));
        }
    }
}

export default {
    logTemplate,
    assertTimestamp,
    assertStructure,
    assertSymbol,
    assertCurrencyCode,
    assertInArray,
    assertFee,
    assertFees,
    assertTimestampOrder,
    assertGreater,
    assertGreaterOrEqual,
    assertLess,
    assertLessOrEqual,
};
