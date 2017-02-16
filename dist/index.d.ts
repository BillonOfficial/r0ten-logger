import { i18n } from "./importer";
export declare type LogType = "error" | "warn" | "debug" | "info" | "verbose" | "silly";
export interface OptionalTranslateInterface extends i18n.TranslateOptions {
    translate: boolean;
    phrase: any;
}
export declare const logIgnoreDetectingOptionsSymbol: symbol;
export interface LoggerConfig {
    emailErrors: {
        active: boolean;
        nodemailer: {
            from: (errors: string[]) => Promise<string>;
            to: (errors: string[]) => Promise<string>;
            smtps: (errors: string[]) => Promise<string>;
            subject: (errors: string[]) => Promise<string>;
            html: (errors: string[]) => Promise<string>;
        };
        trackErrorsInterval: number;
    };
    sails: any;
}
export declare class Logger {
    static readonly splitter: string;
    static defaultConfig(): LoggerConfig;
    private static errorStack;
    static trackErrors(): Promise<void>;
    private static transporter;
    private static _config;
    static readonly config: LoggerConfig;
    static setConfig(options: LoggerConfig): void;
    static sails: any;
    static readonly translateDefaults: i18n.TranslateOptions;
    static humanizeTranslate(options?: i18n.TranslateOptions | string): string;
    static translate(options?: i18n.TranslateOptions | string): string;
    private _path;
    path: string[];
    private _parent;
    parent: Logger;
    constructor(parent: Logger | string, child?: string);
    child(child: string): Logger;
    log(...args: any[]): this;
    error(...args: any[]): this;
    warn(...args: any[]): this;
    debug(...args: any[]): this;
    info(...args: any[]): this;
    verbose(...args: any[]): this;
    silly(...args: any[]): this;
    initiated(...args: any[]): this;
    finished(date?: any, ...args: any[]): this;
    raw(message?: any, ...args: any[]): void;
    inspect(...args: any[]): this;
    private sailsLog(type?, ...args);
    private parseArgumentsToTranslateInterface(...args);
    private translateArr(args);
}
export default Logger;
