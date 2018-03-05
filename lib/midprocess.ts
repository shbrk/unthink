import AST from "./ast";
import { VarNode, StructNode, APINode, OUTTAG, EnumNode } from "./astnode";
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { requireJsonNoComment } from "./json";
import { ETIME } from "constants";
import { ETYPE } from "./types";


let versionFilePath = 'version';

class VerObj {
    versionCode: number = 1;
    versionName: string = "0.0.1";
    versionMD5: string = '';
}

export function midProcess(ast: AST, resPath: string) {
    versionFilePath = path.join(resPath, versionFilePath);
    setEnumVarValue(ast);
    addVersionEnum(ast);
    addDBObjectEnum(ast);
}

function setEnumVarValue(ast: AST) {
    setEnumVarValueRaw(ast.structMapCommon, ast.apiMapCommon, OUTTAG.common, ast);
    setEnumVarValueRaw(ast.structMapClientOnly, ast.apiMapClientOnly, OUTTAG.client, ast);
    setEnumVarValueRaw(ast.structMapServerOnly, ast.apiMapServerOnly, OUTTAG.server, ast);
}


function setEnumVarValueRaw(structMap: Map<string, StructNode>, apiMap: Map<string, APINode>, tag: OUTTAG, ast: AST) {
    for (let sn of structMap.values()) {
        for (let vn of sn.members) { setValue(vn, ast); }
    }
    for (let an of apiMap.values()) {
        if (an.req) { for (let vn of an.req.args) { setValue(vn, ast); } }
        if (an.res) { for (let vn of an.res.args) { setValue(vn, ast); } }
    }
}

function setValue(vn: VarNode, ast: AST) {
    if (vn.value == null) {
        let en = ast.findTypeEnum(vn.type);
        if (en && !en.ismix) vn.value = '0';
    }
}

function addVersionEnum(ast: AST) {
    let verobj = checkVersion(ast);
    let en = new EnumNode();
    en.comment = "工具自动生成的枚举，记录协议版本号";
    en.ismix = true;
    en.name = "ProtoVersion";
    en.members = [];
    let vn = new VarNode();
    vn.name = 'versionCode';
    vn.comment = '协议版本号数字表示';
    vn.type = ETYPE.INT;
    vn.value = verobj.versionCode.toString();
    en.members.push(vn);
    vn = new VarNode();
    vn.name = "versionName";
    vn.comment = '协议版本号字符表示';
    vn.type = ETYPE.STRING;
    vn.value = `"${verobj.versionName}"`;
    en.members.push(vn);
    ast.enumMapCommon.set(en.name, en);
}

function extendsFromDBObject(name: string, ast: AST) {
    while (true) {
        let sn = ast.findTypeStruct(name, OUTTAG.server);
        if (!sn || !sn.base) return false;
        if (sn.base == 'DBBase') return true;
        name = sn.base;
    }
}

function addDBObjectEnum(ast: AST) {
    const map = ast.getStructMap(OUTTAG.server);
    let en = new EnumNode();
    en.comment = "工具自动生成的枚举，枚举所有的存库对象";
    en.ismix = true;
    en.name = "DBOType";
    en.members = [];
    for (let [name, sn] of map.entries()) {
        if (extendsFromDBObject(name, ast) && !sn.nodb) {
            const vn = new VarNode();
            vn.name = name;
            vn.comment = sn.comment;
            vn.type = ETYPE.STRING;
            vn.value = `"${name}"`;
            en.members.push(vn);
        }
    }
    ast.enumMapCommon.set(en.name, en);
}

function makeMD5(ast: AST) {
    const md5 = crypto.createHash('md5');
    let fileList = [...ast.filesCommon, ...ast.filesClientOnly, ...ast.filesServerOnly];
    for (let filePath of fileList) {
        md5.update(JSON.stringify(requireJsonNoComment(filePath)))
    }
    return md5.digest('hex');
}

function checkVersion(ast: AST) {
    let verobj = getOldVersion();
    let md5 = makeMD5(ast);
    if (verobj.versionMD5 != md5) {
        verobj.versionMD5 = md5;
        incrVersion(verobj);
        saveVersion(verobj);
    }
    return verobj;
}

function incrVersion(verobj: VerObj) {
    verobj.versionCode += 1;
    let list = verobj.versionName.split('.');
    if (list.length != 3) return;
    let numlist = [];
    for (let str of list) numlist.push(parseInt(str));
    numlist[2]++;
    for (let i = 2; i >= 0; i--) {
        if (numlist[i] > 9) {
            if (i - 1 >= 0) {
                numlist[i] = 0;
                numlist[i - 1]++;
            }
        }
    }
    verobj.versionName = numlist.join('.');
}


function saveVersion(verobj: VerObj) {
    fs.writeFileSync(versionFilePath, JSON.stringify(verobj, null, '  '));
}

function getOldVersion() {
    if (fs.existsSync(versionFilePath)) {
        let content = fs.readFileSync(versionFilePath).toString();
        return JSON.parse(content) as VerObj;
    }
    let verobj = new VerObj();
    saveVersion(verobj);
    return verobj;
}