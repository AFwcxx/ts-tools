"use strict";

import axios from "axios";
import BigNumber from "bignumber.js";
import moment from 'moment';
import { Decimal128, ObjectId, Long } from "mongodb";

import { HttpRequestData, DecimalString } from "./tools.i";

export class Tools {
  static get <T> (params: HttpRequestData): Promise<T> {
    const { url, data, headers } = params;

    if (!url) {
      throw new Error("Insufficient parameter received.");
    }

    const options: any = {};

    if (headers && JSON.stringify(headers) !== '{}') {
      options.headers = headers;
    }

    if (data && JSON.stringify(data) !== '{}') {
      options.params = data;
    }

    return new Promise((resolve, reject) => {
      axios.get(url, options)
      .then(function (response) {
        resolve(response.data);
      })
      .catch(function (error) {
        if (
          error.response
          && typeof error.response.data === "object"
          && error.response.data.success !== undefined
          && error.response.data.message !== undefined
        ) {
          resolve(error.response.data);
        } else {
          if (error.response && error.response.data && error.response.data.error) {
            reject(error.response.data.error.message ?? error.response.data.error);
          } else {
            reject(error.message ?? error);
          }
        }
      });
    });
  }
  static post <T> (params: HttpRequestData): Promise<T> {
    const { url, data, headers } = params;

    if (!url) {
      throw new Error("Insufficient parameter received.");
    }

    const options: any = {};

    if (headers && JSON.stringify(headers) !== '{}') {
      options.headers = headers;
    }

    return new Promise((resolve, reject) => {
      axios.post(url, data, options)
      .then(function (response) {
        resolve(response.data);
      })
      .catch(function (error) {
        if (
          error.response
          && typeof error.response.data === "object"
          && error.response.data.success !== undefined
          && error.response.data.message !== undefined
        ) {
          resolve(error.response.data);
        } else {
          if (error.response && error.response.data && error.response.data.error) {
            reject(error.response.data.error.message ?? error.response.data.error);
          } else {
            reject(error.message ?? error);
          }
        }
      });
    })
  }
  static to_hex (input: string): string {
    if (!isNaN(Number(input)) && isFinite(Number(input))) {
      const a = new BigNumber(input);
      return a.toString(16);
    } else {
      const buffer = Buffer.from(input);
      return buffer.toString("hex");
    }
  }
  static arithmetic (operation: "+" | "-" | "x" | "/", a: string, b: string, decimal: number = 0): string {
    if (isNaN(parseFloat(a)) || isNaN(parseFloat(b))) {
      throw new Error("Expecting values to be valid numbers.");
    }

    if (["x", "/"].includes(operation)) {
      const left = new BigNumber(a);
      const right = new BigNumber(b);

      if (operation === "x") {
        const result = left.times(right);
        return result.toFixed();
      } else {
        const result = left.div(right);
        return result.toFixed();
      }
    }

    // Remove coma
    let re = new RegExp(',', 'g');
    a = a.replace(re, '');
    b = b.replace(re, '');

    // To integer
    const bigA = Tools.to_int(a, decimal, true) as bigint;
    const bigB = Tools.to_int(b, decimal, true) as bigint;

    if (operation === '+') {
      return Tools.int_to_str(bigA + bigB, decimal);
    } else if (operation === '-') {
      return Tools.int_to_str(bigA - bigB, decimal);
    }

    throw new Error("Invalid arithmetic operation.");
  }
  static to_int (
    value: string,
    decimal: number,
    toBigInt: boolean = false
  ): string | bigint {
    if (isNaN(parseFloat(value))) {
      throw new Error("Expecting value to be number.");
    }

    let theExponent = new BigNumber("10");
    theExponent = theExponent.exponentiatedBy(decimal);

    let bigInt = new BigNumber(value);
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
  static int_to_str (
    value: string | bigint,
    decimal: number
  ): string {
    if (typeof value === "bigint") {
      value = value.toString();
    } else if (isNaN(parseFloat(value))) {
      throw new Error("Expecting value to be number.");
    }

    let theExponent = new BigNumber("10");
    theExponent = theExponent.exponentiatedBy(decimal);

    let bigInt = new BigNumber(value);
    bigInt = bigInt.div(theExponent);

    return bigInt.toFixed(decimal);
  }
  static ago (date: Date): string {
    return moment(date).fromNow();
  }
  static camel_case_to_words (str: string): string {
    const camelCaseRegex = /([A-Z]+(?=$|[A-Z][a-z])|[A-Z]?[a-z]+|\d+)/g;
    const withSpaces = str.replace(camelCaseRegex, '$1 ');
    const done = withSpaces.trim().charAt(0).toUpperCase() + withSpaces.slice(1);

    return done.trim();
  }
  static sanitize_string (input: string): string {
    return input.replace(/[^a-zA-Z0-9]/g, '');
  }
  static is_valid_date (dateStr: string): boolean {
    return !isNaN((new Date(dateStr)).getTime());
  }
  static deep_clone (obj: any): any {
    if (obj === null || typeof obj !== 'object') return obj;

    if (
      obj instanceof Decimal128
      || obj instanceof Long
    ) return obj;

    if (obj instanceof Date) return new Date(obj.getTime());

    if (
      ObjectId.isValid(obj)
      && obj instanceof ObjectId
    ) {
      return ObjectId.createFromHexString(obj.toString());
    }

    if (Array.isArray(obj)) {
      return obj.map(Tools.deep_clone);
    }

    const clonedObj: Record<string,any> = {};

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = Tools.deep_clone(obj[key]);
      }
    }

    return clonedObj;
  }
  static is_decimal_string (value: string): value is DecimalString {
    return /^-?\d+\.\d+$/.test(value);
  }
  static get_date_mysql_format (date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  static get_date_before(
  date: Date | string | number,
  options: { days?: number; seconds?: number }
  ): Date {
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
  static get_unsafe_random_number (x:number, y:number) {
    if (x > y) {
      [x, y] = [y, x]; // Swap if x is greater than y
    }
    return Math.floor(Math.random() * (y - x + 1)) + x;
  }
  static get_unsafe_random_string (length: number = 0) {
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
  static parse_utc_date(str: string): Date {
    // str is something like a MYSQL timestamp
    // eg. "2025-05-25 15:05:11"
    const [datePart, timePart] = str.split(" ");
    const [year, month, day] = datePart.split("-").map(Number);
    const [hour, minute, second] = timePart.split(":").map(Number);

    return new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  }
  static get_decimal_number(integer: string, decimal: string): number {
    // let say the integer value is 41200
    // and the decimal value is 0.412
    // the this function will return 5 decimal places

    const intVal = BigInt(integer);

    // Split into integer and fractional parts
    let [whole, frac = ""] = decimal.split(".");

    // Remove trailing zeros from fractional part
    frac = frac.replace(/0+$/, "");

    // Build decimal as integer without dot
    const decimalInt = BigInt(whole + frac);
    const decimalScale = BigInt(10) ** BigInt(frac.length);

    // We want: intVal == (decimalInt * 10^d) / decimalScale
    // Rearranged: intVal * decimalScale == decimalInt * 10^d

    let d = 0;
    let left = intVal * decimalScale;
    let right = decimalInt;

    // Keep multiplying right by 10 until they match
    while (right < left) {
      right *= 10n;
      d++;
    }

    if (right === left) {
      return d;
    }

    throw new Error("Could not determine decimals");
  }
};
