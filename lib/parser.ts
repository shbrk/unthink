/*
 * @Author: shenzhengyi 
 * @Date: 2018-01-31 14:06:39 
 * @Last Modified by: shenzhengyi
 * @Last Modified time: 2018-02-01 17:27:54
 */

import * as json from './json';
import * as types from './types';
import { EnumNode, StructNode, APINode, OUTTAG, VarNode, ReqNode, ResNode } from "./astnode";


export default class Parser {
    ast: any;
    constructor(ast: any) {
        this.ast = ast;
    }

    parseEnum(enumJsonList: any, enumMap: Map<string, EnumNode>, tag = OUTTAG.common) {
        for (const enumName in enumJsonList) {
            if (json.isComment(enumName)) continue;
            if (types.isKeyWord(enumName)) continue;
            const enumData = enumJsonList[enumName];
            let en = new EnumNode();
            en.name = enumName;
            en.comment = json.getComment(enumName, enumJsonList);
            en.members = new Array<VarNode>();
            en.ismix = false;

            for (const enumMemName in enumData) {
                if (json.isComment(enumMemName)) continue;
                if (types.isKeyWord(enumMemName)) continue;
                let val = enumData[enumMemName];
                let vn = new VarNode();
                vn.name = enumMemName;
                vn.comment = json.getComment(enumMemName, enumData);
                if (!types.isEnumValValid(val))
                    throw new Error(`${val} cannot be value for ${enumName}.${enumMemName}`);
                vn.type = types.getTypeByValueOrThrow(val);
                vn.subtype = [];
                vn.value = types.parseValueByType(vn.type, val);
                if (vn.type != types.ETYPE.INT) en.ismix = true;
                en.members.push(vn);
            }
            enumMap.set(en.name, en);
        }
    }

    parseStruct(structJsonList: any, structMap: Map<string, StructNode>, tag = OUTTAG.common) {
        for (const structName in structJsonList) {
            if (json.isComment(structName)) continue;
            if (types.isKeyWord(structName)) continue;
            const structData = structJsonList[structName];
            let sn = new StructNode();
            sn.name = structName;
            sn.base = types.getExtend(structData);
            sn.comment = json.getComment(structName, structJsonList);
            sn.members = new Array<VarNode>();

            for (const structMemName in structData) {
                if (json.isComment(structMemName)) continue;
                if (types.isKeyWord(structMemName)) continue;
                let val = structData[structMemName];
                let vn = new VarNode();
                vn.name = structMemName;
                vn.comment = json.getComment(structMemName, structData);
                vn.type = types.getTypeByDescOrThrow(val);
                vn.subtype = types.getSubTypeByDescOrThrow(val);
                vn.value = types.getDefaultValByType(vn.type, val);
                sn.members.push(vn);
            }
            structMap.set(sn.name, sn);
        }
    }

    parseAPI(apiJsonList: any, apiMap: Map<string, APINode>, tag = OUTTAG.common) {

        for (const apiModName in apiJsonList) {
            if (json.isComment(apiModName)) continue;
            if (types.isKeyWord(apiModName)) continue;
            const apiModData = apiJsonList[apiModName];

            for (const apiName in apiModData) {
                if (json.isComment(apiName)) continue;
                if (types.isKeyWord(apiName)) continue;
                const apiData = apiModData[apiName];
                const reqData = types.getReqOrThrow(apiData, apiModName, apiName);
                const resData = types.getResOrThrow(apiData, apiModName, apiName);

                let an = new APINode();
                an.req = new ReqNode();
                an.res = new ResNode();

                an.name = apiName;
                an.mod = apiModName;
                an.comment = json.getComment(apiName, apiModData);

                an.req.comment = json.getComment(types.KEYWORD.REQ, apiData);
                an.res.comment = json.getComment(types.KEYWORD.RES, apiData);

                an.req.args = new Array<VarNode>();
                for (const argName in reqData) {
                    if (json.isComment(argName)) continue;
                    if (types.isKeyWord(argName)) continue;
                    let vn = new VarNode();
                    let val = reqData[argName];
                    vn.name = argName;
                    vn.comment = json.getComment(argName, reqData);
                    vn.type = types.getTypeByDescOrThrow(val);
                    vn.subtype = types.getSubTypeByDescOrThrow(val);
                    vn.value = types.getDefaultValByType(vn.type, val);
                    an.req.args.push(vn);
                }

                an.res.args = new Array<VarNode>();
                for (const argName in resData) {
                    if (json.isComment(argName)) continue;
                    if (types.isKeyWord(argName)) continue;
                    let vn = new VarNode();
                    let val = resData[argName];
                    vn.name = argName;
                    vn.comment = json.getComment(argName, resData);
                    vn.type = types.getTypeByDescOrThrow(val);
                    vn.subtype = types.getSubTypeByDescOrThrow(val);
                    vn.value = types.getDefaultValByType(vn.type, val);
                    an.res.args.push(vn);
                }

                let apiCompleteName = `${apiModName}.${apiName}`;
                apiMap.set(apiCompleteName, an);
            }
        }
    }
}