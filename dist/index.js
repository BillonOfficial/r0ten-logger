"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const importer_1 = require("./importer");
let sailsObject;
if (typeof sails !== "undefined") {
    sailsObject = sails;
}
else {
    sailsObject = {};
}
const onlySpecial = "^[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?]*$";
const onlySpecialCharacters = new RegExp(onlySpecial);
exports.logIgnoreDetectingOptionsSymbol = Symbol("ignore detecting options");
class Logger {
    constructor(parent, child) {
        this._path = [];
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
    static get splitter() {
        return "::";
    }
    static defaultConfig() {
        return {
            emailErrors: {
                active: false,
                nodemailer: {},
                trackErrorsInterval: importer_1.ms("15m"),
            },
            sails: sailsObject,
        };
    }
    static trackErrors() {
        return __awaiter(this, void 0, void 0, function* () {
            const emailErrors = Logger.config.emailErrors;
            if (!emailErrors.active) {
                throw new Error(`To track errors r0ten-logger must have defined config.emailErrors.`);
            }
            setInterval(() => __awaiter(this, void 0, void 0, function* () {
                if (Logger.errorStack.length > 0) {
                    Logger.transporter.sendMail({
                        html: yield emailErrors.nodemailer.html(Logger.errorStack),
                        subject: yield emailErrors.nodemailer.subject(Logger.errorStack),
                        to: yield emailErrors.nodemailer.to(Logger.errorStack),
                        from: yield emailErrors.nodemailer.from(Logger.errorStack),
                    });
                    Logger.errorStack = [];
                }
            }), emailErrors.trackErrorsInterval);
        });
    }
    static get config() {
        return this._config;
    }
    static setConfig(options) {
        this._config = importer_1._.defaults(options || {}, Logger.defaultConfig());
        if (this._config.emailErrors) {
            Logger.transporter = importer_1.nodemailer.createTransport(this._config.emailErrors.nodemailer.smtps);
        }
        this.sails = this._config.sails;
    }
    static get translateDefaults() {
        return {
            locale: Logger.sails.config.i18n.defaultLocale,
            phrase: "",
        };
    }
    static humanizeTranslate(options = Logger.translateDefaults) {
        return importer_1.S(Logger.translate(options)).humanize().s;
    }
    static translate(options = Logger.translateDefaults) {
        let phrase;
        if (typeof options === "string") {
            phrase = options;
        }
        else {
            phrase = options.phrase;
        }
        options = importer_1._.defaults({
            phrase: phrase.toLowerCase(),
        }, Logger.translateDefaults);
        return Logger.sails.__(options);
    }
    get path() {
        return this._path;
    }
    set path(value) {
        this._path = value;
    }
    get parent() {
        return this._parent;
    }
    set parent(value) {
        this._parent = value;
    }
    child(child) {
        return new Logger(this, child);
    }
    log(...args) {
        return this.sailsLog("debug", ...args);
    }
    error(...args) {
        if (Logger.config.emailErrors) {
            const stringErrors = importer_1._.map(args, (object) => {
                if (typeof object !== "string") {
                    object = JSON.stringify(object);
                }
                return object;
            });
            Logger.errorStack.push(...stringErrors);
        }
        return this.sailsLog("error", ...args);
    }
    warn(...args) {
        return this.sailsLog("warn", ...args);
    }
    debug(...args) {
        return this.sailsLog("debug", ...args);
    }
    info(...args) {
        return this.sailsLog("info", ...args);
    }
    verbose(...args) {
        return this.sailsLog("verbose", ...args);
    }
    silly(...args) {
        return this.sailsLog("silly", ...args);
    }
    initiated(...args) {
        return this.log(`initiated`, ...args);
    }
    finished(date, ...args) {
        let message = `finished`;
        if (date instanceof Date) {
            message += `in ${Math.round((Date.now() - date.getTime()) / 10) / 100}s`;
        }
        return this.log(message, ...args);
    }
    raw(message, ...args) {
        console.log(message, ...args);
    }
    inspect(...args) {
        const out = [];
        importer_1._.each(args, (arg) => {
            out.push(importer_1.util.inspect(arg));
        });
        return this.log(out);
    }
    sailsLog(type = "debug", ...args) {
        const splittedArray = [];
        importer_1._.each(args, (item) => {
            splittedArray.push(Logger.splitter);
            splittedArray.push(item);
        });
        Logger.sails.log[type](this.path.join(` ${Logger.splitter} `), ...splittedArray);
        return this;
    }
    parseArgumentsToTranslateInterface(...args) {
        return importer_1._.map(args, (arg) => {
            let phrase;
            let translate = false;
            if (typeof arg.phrase === "string") {
                phrase = arg.phrase;
                if (isNaN(+arg.phrase)
                    && !onlySpecialCharacters.test(arg.phrase)
                    && Array.isArray(arg.s) && importer_1._.includes(arg.s, exports.logIgnoreDetectingOptionsSymbol)) {
                    translate = true;
                }
            }
            else {
                phrase = arg;
            }
            return {
                phrase: phrase,
                translate: translate,
            };
        });
    }
    translateArr(args) {
        return importer_1._.map(args, (translateObject, i) => {
            let data = translateObject.phrase;
            if (translateObject.translate) {
                return Logger.translate(data);
            }
            return data;
        });
    }
}
Logger.errorStack = [];
Logger.sails = sailsObject;
exports.Logger = Logger;
//# sourceMappingURL=index.js.map