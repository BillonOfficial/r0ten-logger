/* tslint:disable:max-line-length */
import {
    S, _, util, i18n, nodemailer, ms,
} from "./importer";
/* tslint:enable:max-line-length */

declare const sails: {} | undefined;
let sailsObject: {};
if (typeof sails !== "undefined") {
    sailsObject = sails;
} else {
    sailsObject = {};
}

const onlySpecial = "^[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?]*$";
const onlySpecialCharacters = new RegExp(onlySpecial);

export type LogType = "error" | "warn" | "debug" | "info" | "verbose" | "silly";

export interface OptionalTranslateInterface extends i18n.TranslateOptions {
    translate: boolean;
    phrase: any;
}

export const logIgnoreDetectingOptionsSymbol = Symbol("ignore detecting options");

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
    },
    sails: any,
}

export class Logger {
    public static get splitter() {
        return "::";
    }

    public static defaultConfig(): LoggerConfig {
        return {
            emailErrors: {
                active: false,
                nodemailer: {
                    async from(errors) {
                        return "";
                    },
                    async to(errors) {
                        return "";
                    },
                    async smtps(errors) {
                        return "";
                    },
                    async subject(errors) {
                        return "";
                    },
                    async html(errors) {
                        return "";
                    },
                },
                trackErrorsInterval: ms("15m"),
            },
            sails: sailsObject,
        };
    }

    private static errorStack: string[] = [];
    public static async trackErrors() {
        const emailErrors = Logger.config.emailErrors;
        if (!emailErrors.active) {
            throw new Error(`To track errors r0ten-logger must have defined config.emailErrors.`);
        }

        setInterval(async () => {
            if (Logger.errorStack.length > 0) {
                Logger.transporter.sendMail({
                    html: await emailErrors.nodemailer.html(Logger.errorStack),
                    subject: await emailErrors.nodemailer.subject(Logger.errorStack),
                    to: await emailErrors.nodemailer.to(Logger.errorStack),
                    from: await emailErrors.nodemailer.from(Logger.errorStack),
                });

                Logger.errorStack = [];
            }
        }, emailErrors.trackErrorsInterval);
    }

    private static transporter: nodemailer.Transporter;

    private static _config: LoggerConfig;
    public static get config() {
        return this._config;
    }

    public static setConfig(options: LoggerConfig) {
        this._config = _.defaults(options || {}, Logger.defaultConfig());
        console.log(this._config);
        if (this._config.emailErrors) {
            Logger.transporter = nodemailer.createTransport(this._config.emailErrors.nodemailer.smtps);
        }

        this.sails = this._config.sails;
    }

    public static sails: any = sailsObject;

    public static get translateDefaults(): i18n.TranslateOptions {
        return {
            locale: Logger.sails.config.i18n.defaultLocale,
            phrase: "",
        };
    }

    public static humanizeTranslate(options: i18n.TranslateOptions | string = Logger.translateDefaults) {
        return S(Logger.translate(options)).humanize().s;
    }

    public static translate(options: i18n.TranslateOptions | string = Logger.translateDefaults): string {
        let phrase: string;
        if (typeof options === "string") {
            phrase = options;
        } else {
            phrase = options.phrase;
        }

        options = _.defaults({
            phrase: phrase.toLowerCase(),
        }, Logger.translateDefaults);

        return Logger.sails.__(options);
    }

    private _path: string[] = [];
    get path() {
        return this._path;
    }
    set path(value) {
        this._path = value;
    }

    private _parent: Logger;
    public get parent() {
        return this._parent;
    }
    public set parent(value) {
        this._parent = value;
    }

    constructor(parent: Logger | string, child?: string) {
        if (typeof parent === "string") {
            this.parent = this;
            this.path.push(parent);
            return;
        }

        this.parent = parent;
        this.path = this.path.concat(parent.path);
        if (child) {
            this.path.push(child);
        }
    }

    public child(child: string) {
        return new Logger(this, child);
    }

    public log(...args: any[]) {
        return this.sailsLog("debug", ...args);
    }

    public error(...args: any[]) {
        if (Logger.config.emailErrors) {
            const stringErrors: string[] = _.map(args, (object: any) => {
                if (typeof object !== "string") {
                    object = JSON.stringify(object);
                }

                return object;
            });

            Logger.errorStack.push(...stringErrors);
        }

        return this.sailsLog("error", ...args);
    }

    public warn(...args: any[]) {
        return this.sailsLog("warn", ...args);
    }

    public debug(...args: any[]) {
        return this.sailsLog("debug", ...args);
    }

    public info(...args: any[]) {
        return this.sailsLog("info", ...args);
    }

    public verbose(...args: any[]) {
        return this.sailsLog("verbose", ...args);
    }

    public silly(...args: any[]) {
        return this.sailsLog("silly", ...args);
    }

    public initiated(...args: any[]) {
        return this.log(`initiated`, ...args);
    }

    public finished(date?: any, ...args: any[]) {
        let message = `finished`;

        if (date instanceof Date) {
            message += `in ${Math.round((Date.now() - date.getTime()) / 10) / 100}s`;
        }

        return this.log(message, ...args);
    }

    public raw(message?: any, ...args: any[]) {
        /* tslint:disable:no-console */
        console.log(message, ...args);
        /* tslint:enable:no-console */
    }

    public inspect(...args: any[]) {
        const out: string[] = [];
        _.each(args, (arg) => {
            out.push(util.inspect(arg));
        });
        return this.log(out);
    }

    private sailsLog(type: LogType = "debug", ...args: any[]) {
        // let optionalTranslateFormat = this.parseArgumentsToTranslateInterface(...args);
        // let translatedArray = this.translateArr(optionalTranslateFormat);
        // let splittedArray: any[] = [];
        // _.each(translatedArray, (item) => {
        //     splittedArray.push(Logger.splitter);
        //     splittedArray.push(item);
        // });
        const splittedArray: any[] = [];
        _.each(args, (item) => {
            splittedArray.push(Logger.splitter);
            splittedArray.push(item);
        });
        (<any>Logger.sails).log[type](this.path.join(` ${Logger.splitter} `), ...splittedArray);
        return this;
    }

    private parseArgumentsToTranslateInterface(...args: any[]): OptionalTranslateInterface[] {
        return _.map(args, (arg) => {
            let phrase: any;
            let translate = false;

            if (typeof arg.phrase === "string") {
                phrase = arg.phrase;

                if (
                    // do not translate number strings
                    isNaN(+arg.phrase)
                    // do not translate messages with only special characters
                    && !onlySpecialCharacters.test(arg.phrase)
                    // do not translate if added logIgnoreDetectingOptionsSymbol
                    && Array.isArray(arg.s) && _.includes(arg.s, logIgnoreDetectingOptionsSymbol)) {
                    translate = true;
                }

            } else {
                phrase = arg;
            }

            return {
                phrase: phrase,
                translate: translate,
            };
        });
    }

    private translateArr(args: OptionalTranslateInterface[]) {
        return _.map(args, (translateObject, i) => {
            let data = translateObject.phrase;
            if (translateObject.translate) {
                return Logger.translate(data);
            }

            return data;
        });
    }

}

export default Logger;
