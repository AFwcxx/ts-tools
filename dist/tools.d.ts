import { HttpRequestData, DecimalString } from "./tools.i";
export declare class Tools {
    static get<T>(params: HttpRequestData): Promise<T>;
    static post<T>(params: HttpRequestData): Promise<T>;
    static to_hex(input: string): string;
    static arithmetic(operation: "+" | "-" | "x" | "/", a: string, b: string, decimal?: number): string;
    static to_int(value: string, decimal: number, toBigInt?: boolean): string | bigint;
    static int_to_str(value: string | bigint, decimal: number): string;
    static ago(date: Date): string;
    static camel_case_to_words(str: string): string;
    static sanitize_string(input: string): string;
    static is_valid_date(dateStr: string): boolean;
    static deep_clone(obj: any): any;
    static is_decimal_string(value: string): value is DecimalString;
    static get_date_mysql_format(date: Date): string;
    static get_date_before(date: Date | string | number, options: {
        days?: number;
        seconds?: number;
    }): Date;
    static get_unsafe_random_number(x: number, y: number): number;
    static get_unsafe_random_string(length?: number): string;
}
