/*
 * @Author: shenzhengyi 
 * @Date: 2018-01-31 14:05:34 
 * @Last Modified by: shenzhengyi
 * @Last Modified time: 2018-02-02 10:42:39
 */

import * as json from './json';
import * as types from './types';
import { EnumNode, StructNode, APINode, OUTTAG } from "./astnode";
import Parser from './parser';
import TypeChecker from './typechecker';


export default class AST {

    enumMapCommon = new Map<string, EnumNode>();
    structMapCommon = new Map<string, StructNode>();
    apiMapCommon = new Map<string, APINode>();

    enumMapClientOnly = new Map<string, EnumNode>();
    structMapClientOnly = new Map<string, StructNode>();
    apiMapClientOnly = new Map<string, APINode>();

    enumMapServerOnly = new Map<string, EnumNode>();
    structMapServerOnly = new Map<string, StructNode>();
    apiMapServerOnly = new Map<string, APINode>();

    parser: Parser;
    checker: TypeChecker;
    config: any;

    filesCommon: string[] = [];
    filesClientOnly: string[] = [];
    filesServerOnly: string[] = [];

    constructor(config: any) {
        this.config = config;
        this.parser = new Parser(this);
        this.checker = new TypeChecker(this);
    }

    addFile(filePath: string, tag = OUTTAG.common) {
        if (tag == OUTTAG.common)
            this.filesCommon.push(filePath);
        else if (tag == OUTTAG.client)
            this.filesClientOnly.push(filePath);
        else if (tag == OUTTAG.server)
            this.filesServerOnly.push(filePath);
    }

    addEnum(filePath: string, tag = OUTTAG.common) {
        this.addFile(filePath, tag);
        let jsonObj = json.requireJson(filePath);
        if (tag == OUTTAG.client)
            this.parser.parseEnum(jsonObj, this.enumMapClientOnly);
        else if (tag == OUTTAG.server)
            this.parser.parseEnum(jsonObj, this.enumMapServerOnly)
        else
            this.parser.parseEnum(jsonObj, this.enumMapCommon);
    }

    addStruct(filePath: string, tag = OUTTAG.common) {
        this.addFile(filePath, tag);
        let jsonObj = json.requireJson(filePath);
        if (tag == OUTTAG.client)
            this.parser.parseStruct(jsonObj, this.structMapClientOnly);
        else if (tag == OUTTAG.server)
            this.parser.parseStruct(jsonObj, this.structMapServerOnly)
        else
            this.parser.parseStruct(jsonObj, this.structMapCommon);
    }

    addAPI(filePath: string, tag = OUTTAG.common) {
        this.addFile(filePath, tag);
        let jsonObj = json.requireJson(filePath);
        if (tag == OUTTAG.client)
            this.parser.parseAPI(jsonObj, this.apiMapClientOnly);
        else if (tag == OUTTAG.server)
            this.parser.parseAPI(jsonObj, this.apiMapServerOnly)
        else
            this.parser.parseAPI(jsonObj, this.apiMapCommon);
    }

    typeCheck() {
        this.checker.typeCheckOrThrow();
    }

    findTypeBuildin(t: string) {
        for (let e in types.ETYPE) {
            if (types.ETYPE[e] == t) return t;
        }
        return undefined;
    }

    findTypeEnum(t: string, tag = OUTTAG.common) {
        if (tag == OUTTAG.client) {
            return this.enumMapClientOnly.get(t) || this.enumMapCommon.get(t);
        }
        else if (tag == OUTTAG.server) {
            return this.enumMapServerOnly.get(t) || this.enumMapCommon.get(t);
        }
        else {
            return this.enumMapCommon.get(t);
        }
    }

    findTypeStruct(t: string, tag = OUTTAG.common) {
        if (tag == OUTTAG.client) {
            return this.structMapClientOnly.get(t) || this.structMapCommon.get(t);
        }
        else if (tag == OUTTAG.server) {
            return this.structMapServerOnly.get(t) || this.structMapCommon.get(t);
        }
        else {
            return this.structMapCommon.get(t);
        }
    }

    getEnumMap(tag: OUTTAG = OUTTAG.common) {
        if (tag == OUTTAG.common) {
            return this.enumMapCommon;
        }
        else if (tag == OUTTAG.client) {
            return this.concatMap([this.enumMapCommon, this.enumMapClientOnly]) as Map<string, EnumNode>;
        }
        else {
            return this.concatMap([this.enumMapCommon, this.enumMapServerOnly]) as Map<string, EnumNode>;
        }

    }

    getStructMap(tag: OUTTAG = OUTTAG.common) {
        if (tag == OUTTAG.common) {
            return this.structMapCommon;
        }
        else if (tag == OUTTAG.client) {
            return this.concatMap([this.structMapCommon, this.structMapClientOnly]) as Map<string, StructNode>;
        }
        else {
            return this.concatMap([this.structMapCommon, this.structMapServerOnly]) as Map<string, StructNode>;
        }

    }

    getAPIMap(tag: OUTTAG = OUTTAG.common) {
        if (tag == OUTTAG.common) {
            return this.apiMapCommon;
        }
        else if (tag == OUTTAG.client) {
            return this.concatMap([this.apiMapCommon, this.apiMapClientOnly]) as Map<string, APINode>;
        }
        else {
            return this.concatMap([this.apiMapCommon, this.apiMapServerOnly]) as Map<string, APINode>;
        }

    }

    concatMap(maps: Map<any, any>[]) {
        let ret = new Map<any, any>();
        for (let m of maps) {
            for (let [k, v] of m.entries()) {
                ret.set(k, v);
            }
        }
        return ret;
    }
}
