"use strict";
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
Logger.sails = sailsObject;
exports.Logger = Logger;
//# sourceMappingURL=index.js.map