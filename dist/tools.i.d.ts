import { OutgoingHttpHeaders } from "http";
export type DecimalString = string & {
    __isDecimal: true;
};
export interface HttpRequestData {
    url: string;
    data: Record<string, any>;
    headers?: OutgoingHttpHeaders;
}
