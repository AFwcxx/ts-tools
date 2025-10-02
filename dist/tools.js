"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tools = void 0;
const axios_1 = __importDefault(require("axios"));
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const moment_1 = __importDefault(require("moment"));
const mongodb_1 = require("mongodb");
class Tools {
    static get(params) {
        const { url, data, headers } = params;
        if (!url) {
            throw new Error("Insufficient parameter received.");
        }
        const options = {};
        if (headers && JSON.stringify(headers) !== '{}') {
            options.headers = headers;
        }
        if (data && JSON.stringify(data) !== '{}') {
            options.params = data;
        }
        return new Promise((resolve, reject) => {
            axios_1.default.get(url, options)
                .then(function (response) {
                resolve(response.data);
            })
                .catch(function (error) {
                if (error.response
                    && typeof error.response.data === "object"
                    && error.response.data.success !== undefined
                    && error.response.data.message !== undefined) {
                    resolve(error.response.data);
                }
                else {
                    if (error.response.data && error.response.data.error) {
                        reject(error.response.data.error.message ?? error.response.data.error);
                    }
                    else {
                        reject(error.message ?? error);
                    }
                }
            });
        });
    }
    static post(params) {
        const { url, data, headers } = params;
        if (!url) {
            throw new Error("Insufficient parameter received.");
        }
        const options = {};
        if (headers && JSON.stringify(headers) !== '{}') {
            options.headers = headers;
        }
        return new Promise((resolve, reject) => {
            axios_1.default.post(url, data, options)
                .then(function (response) {
                resolve(response.data);
            })
                .catch(function (error) {
                if (error.response
                    && typeof error.response.data === "object"
                    && error.response.data.success !== undefined
                    && error.response.data.message !== undefined) {
                    resolve(error.response.data);
                }
                else {
                    if (error.response.data && error.response.data.error) {
                        reject(error.response.data.error.message ?? error.response.data.error);
                    }
                    else {
                        reject(error.message ?? error);
                    }
                }
            });
        });
    }
    static to_hex(input) {
        if (!isNaN(Number(input)) && isFinite(Number(input))) {
            const a = new bignumber_js_1.default(input);
            return a.toString(16);
        }
        else {
            const buffer = Buffer.from(input);
            return buffer.toString("hex");
        }
    }
    static arithmetic(operation, a, b, decimal = 0) {
        if (isNaN(parseFloat(a)) || isNaN(parseFloat(b))) {
            throw new Error("Expecting values to be valid numbers.");
        }
        if (["x", "/"].includes(operation)) {
            const left = new bignumber_js_1.default(a);
            const right = new bignumber_js_1.default(b);
            if (operation === "x") {
                const result = left.times(right);
                return result.toFixed();
            }
            else {
                const result = left.div(right);
                return result.toFixed();
            }
        }
        let re = new RegExp(',', 'g');
        a = a.replace(re, '');
        b = b.replace(re, '');
        const bigA = Tools.to_int(a, decimal, true);
        const bigB = Tools.to_int(b, decimal, true);
        if (operation === '+') {
            return Tools.int_to_str(bigA + bigB, decimal);
        }
        else if (operation === '-') {
            return Tools.int_to_str(bigA - bigB, decimal);
        }
        throw new Error("Invalid arithmetic operation.");
    }
    static to_int(value, decimal, toBigInt = false) {
        if (isNaN(parseFloat(value))) {
            throw new Error("Expecting value to be number.");
        }
        let theExponent = new bignumber_js_1.default("10");
        theExponent = theExponent.exponentiatedBy(decimal);
        let bigInt = new bignumber_js_1.default(value);
        bigInt = bigInt.times(theExponent);
        if (!bigInt.isInteger()) {
            throw new Error("Invalid decimal value to convert to integer.");
        }
        const stringBigInt = bigInt.toFixed();
        if (!toBigInt) {
            return stringBigInt;
        }
        return BigInt(stringBigInt);
    }
    static int_to_str(value, decimal) {
        if (typeof value === "bigint") {
            value = value.toString();
        }
        else if (isNaN(parseFloat(value))) {
            throw new Error("Expecting value to be number.");
        }
        let theExponent = new bignumber_js_1.default("10");
        theExponent = theExponent.exponentiatedBy(decimal);
        let bigInt = new bignumber_js_1.default(value);
        bigInt = bigInt.div(theExponent);
        return bigInt.toFixed(decimal);
    }
    static ago(date) {
        return (0, moment_1.default)(date).fromNow();
    }
    static camel_case_to_words(str) {
        const camelCaseRegex = /([A-Z]+(?=$|[A-Z][a-z])|[A-Z]?[a-z]+|\d+)/g;
        const withSpaces = str.replace(camelCaseRegex, '$1 ');
        const done = withSpaces.trim().charAt(0).toUpperCase() + withSpaces.slice(1);
        return done.trim();
    }
    static sanitize_string(input) {
        return input.replace(/[^a-zA-Z0-9]/g, '');
    }
    static is_valid_date(dateStr) {
        return !isNaN((new Date(dateStr)).getTime());
    }
    static deep_clone(obj) {
        if (obj === null || typeof obj !== 'object')
            return obj;
        if (obj instanceof mongodb_1.Decimal128
            || obj instanceof mongodb_1.Long)
            return obj;
        if (obj instanceof Date)
            return new Date(obj.getTime());
        if (mongodb_1.ObjectId.isValid(obj)
            && obj instanceof mongodb_1.ObjectId) {
            return mongodb_1.ObjectId.createFromHexString(obj.toString());
        }
        if (Array.isArray(obj)) {
            return obj.map(Tools.deep_clone);
        }
        const clonedObj = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = Tools.deep_clone(obj[key]);
            }
        }
        return clonedObj;
    }
    static is_decimal_string(value) {
        return /^-?\d+\.\d+$/.test(value);
    }
    static get_date_mysql_format(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    static get_date_before(date, options) {
        const base = new Date(date);
        if (isNaN(base.getTime())) {
            throw new Error("Invalid date provided");
        }
        let time = base.getTime();
        if (options.days) {
            time -= options.days * 24 * 60 * 60 * 1000;
        }
        if (options.seconds) {
            time -= options.seconds * 1000;
        }
        return new Date(time);
    }
    static get_unsafe_random_number(x, y) {
        if (x > y) {
            [x, y] = [y, x];
        }
        return Math.floor(Math.random() * (y - x + 1)) + x;
    }
    static get_unsafe_random_string(length = 0) {
        if (length === 0) {
            length = Tools.get_unsafe_random_number(1, 100);
        }
        var result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }
    static parse_utc_date(str) {
        const [datePart, timePart] = str.split(" ");
        const [year, month, day] = datePart.split("-").map(Number);
        const [hour, minute, second] = timePart.split(":").map(Number);
        return new Date(Date.UTC(year, month - 1, day, hour, minute, second));
    }
    static get_decimal_number(integer, decimal) {
        const intVal = BigInt(integer);
        let [whole, frac = ""] = decimal.split(".");
        frac = frac.replace(/0+$/, "");
        const decimalInt = BigInt(whole + frac);
        const decimalScale = BigInt(10) ** BigInt(frac.length);
        let d = 0;
        let left = intVal * decimalScale;
        let right = decimalInt;
        while (right < left) {
            right *= 10n;
            d++;
        }
        if (right === left) {
            return d;
        }
        throw new Error("Could not determine decimals");
    }
}
exports.Tools = Tools;
;
//# sourceMappingURL=tools.js.map