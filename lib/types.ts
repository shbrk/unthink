import { format } from "util";
import { OUTTAG } from "./astnode";

/*
 * @Author: shenzhengyi 
 * @Date: 2018-01-31 14:05:09 
 * @Last Modified by: shenzhengyi
 * @Last Modified time: 2018-02-01 17:41:44
 */

export enum ETYPE {
    BOOL = "bool",
    STRING = 'string',
    INT = 'int',
    INT64 = 'int64',
    FLOAT = 'float',
    DOUBLE = 'double',
    ARRAY = 'array',
    OBJECT = 'object'
};

export enum KEYWORD {
    TYPE = "<type>",
    DEFAULT = "<default>",
    DBTYPE = "<dbtype>",
    EXTENDS = "<extends>",
    REQ = "<req>",
    RES = "<res>"
}


const ARRAY_START = 'array<';
const ARRAY_END = ">";

export function isKeyWord(name: string) {
    for (let key in KEYWORD) {
        if (KEYWORD[key] == name) return true;
    }
    return false;
}

export function parseValueByType(t: string, val: any) {
    if (val == null) return 'null';
    if (t == ETYPE.STRING) {
        return format('"%s"', val.toString());
    }
    return val.toString();
}

export function getTypeByValueOrThrow(val: any) {
    let typeStr = typeof val;
    if (typeStr == 'string') {
        return ETYPE.STRING;
    }
    else if (typeStr == "boolean")
        return ETYPE.BOOL;
    else if (typeStr == 'number') {
        return Number.isInteger(val) ? ETYPE.INT : ETYPE.DOUBLE;
    }
    else if (typeStr == 'object') {
        if (Array.isArray(val))
            return ETYPE.ARRAY;
        else
            return ETYPE.OBJECT;
    }
    throw new Error(`cannot tell type of value:${val}`);
}

function getDescType(val: any) {
    if (typeof val == 'string')
        return val;
    else if (val[KEYWORD.TYPE])
        return val[KEYWORD.TYPE];
    return '';
}

function getDescVal(val: any) {
    if (typeof val == 'string')
        return "";
    else if (val[KEYWORD.DEFAULT])
        return val[KEYWORD.DEFAULT];
    return '';
}

export function getTypeByDescOrThrow(val: any) {
    let t: string = getDescType(val);
    if (t && t != '') {
        if (t.startsWith(ARRAY_START) && t.endsWith(ARRAY_END))
            return ETYPE.ARRAY;
        return t;
    }

    throw new Error(`cannot tell type:${val}`);
}

export function getSubTypeByDescOrThrow(val: any) {
    let tlist: string[] = [];
    let t = getTypeByDescOrThrow(val)
    if (t != ETYPE.ARRAY)
        return tlist;
    t = getDescType(val);
    while (true) {
        t = t.slice(ARRAY_START.length, -(ARRAY_END.length));
        if (getTypeByDescOrThrow(t) != ETYPE.ARRAY) {
            tlist.push(t);
            break;
        }
        tlist.push(ETYPE.ARRAY);
    }
    return tlist;
}

export function getDefaultValByType(t: string, val: any) {
    let descVal = getDescVal(val)
    if (descVal && descVal != '') return parseValueByType(t, descVal);
    return null;
}

export function isEnumValValid(val: any) {
    let t = getTypeByValueOrThrow(val)
    if (t == ETYPE.STRING || t == ETYPE.INT
        || t == ETYPE.DOUBLE || t == ETYPE.BOOL)
        return true;
    return false;
}

export function getExtend(obj: any) {
    if (obj[KEYWORD.EXTENDS])
        return obj[KEYWORD.EXTENDS];
    return null;
}

export function getReqOrThrow(obj: any, mod: string, name: string, throwable: boolean = true) {
    if (obj[KEYWORD.REQ])
        return obj[KEYWORD.REQ];
    if (!throwable) return null;
    throw new Error(`${mod}.${name} api need a req define`);
}

export function getResOrThrow(obj: any, mod: string, name: string, throwable: boolean = true) {
    if (obj[KEYWORD.RES])
        return obj[KEYWORD.RES];
    if (!throwable) return null;
    throw new Error(`${mod}.${name} api need a res define`);
}