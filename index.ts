/* tslint:disable:max-line-length */
import {
    S, _, util, i18n,
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

export class Logger {
    public static get splitter() {
        return "::";
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
