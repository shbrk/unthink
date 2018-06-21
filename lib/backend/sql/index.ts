/*
 * @Author: shenzhengyi 
 * @Date: 2018-02-27 20:31:44 
 * @Last Modified by: shenzhengyi
 * @Last Modified time: 2018-03-01 11:35:03
 */


import AST from "../../ast";
import { OUTTAG, VarNode, StructNode } from "../../astnode";
import { ETYPE } from "../../types";
import { render } from "../../helper";
import * as path from 'path';

let typeTable: any = {};
typeTable[ETYPE.ARRAY] = 'text NOT NULL';
typeTable[ETYPE.BOOL] = 'tinyint(4) NOT NULL';
typeTable[ETYPE.DOUBLE] = 'double NOT NULL';
typeTable[ETYPE.FLOAT] = 'float';
typeTable[ETYPE.INT] = 'int(11) NOT NULL';
typeTable[ETYPE.INT64] = 'bigint(20) NOT NULL';
typeTable[ETYPE.STRING] = 'varchar(64) NOT NULL';
typeTable[ETYPE.OBJECT] = 'text NOT NULL';

export default function (ast: AST, conf: any, ejsPath: string) {
    let outPath = typeof conf == 'string' ? conf : conf.path;
    ejsPath = path.join(ejsPath, 'sql');

    const map = ast.getStructMap(OUTTAG.server);
    const dbs: { [key: string]: any[] } = {};
    for (let sn of map.values()) {
        if (!sn.nodb && extendsFromDBObject(sn.name, ast)) {
            const target = generate(sn, ast);
            if (!dbs[target.databaseSetting.databaseName]) {
                dbs[target.databaseSetting.databaseName] = [];
            }
            dbs[target.databaseSetting.databaseName].push(target);
        }
    }
    for (let name in dbs) {
        const data: any = {};
        data.mems = dbs[name];
        data.dbPrefix = conf.dbPrefix || '';
        data.tablePrefix = conf.tablePrefix || '';
        data.fulldbname = `${data.dbPrefix}${name}`;
        data.dbname = name;
        data.dbShardingCount = conf.dbShardingCount || 1;
        data.tableShardingCount = conf.tableShardingCount || 1;
        data.sharding = data.mems.length > 0 ? data.mems[0].databaseSetting.sharding : false;
        data.time = getNowStr();
        render(`${data.fulldbname}_auto_generate.sql`, 'sql.ejs', data, ejsPath, outPath);
    }
}

function extendsFromDBObject(name: string, ast: AST) {
    while (true) {
        let sn = ast.findTypeStruct(name, OUTTAG.server);
        if (!sn || !sn.base) return false;
        if (sn.base == 'DBBase') return true;
        name = sn.base;
    }
}

function extendsFromShardDBObject(name: string, ast: AST) {
    while (true) {
        let sn = ast.findTypeStruct(name, OUTTAG.server);
        if (!sn || !sn.base) return false;
        if (sn.base == 'ShardDBObject') return true;
        name = sn.base;
    }
}


function getExtendsDBName(name: string, ast: AST) {
    while (true) {
        let sn = ast.findTypeStruct(name, OUTTAG.server);
        if (!sn) return undefined;
        if(sn.dbname) return sn.dbname;
        if(!sn.base) return undefined;
        name = sn.base;
    }
}

function generate(sn: StructNode, ast: AST) {
    let { members, index } = getAllMembers(sn.name, ast);
    let data: any = {};
    let mems: any[] = [];
    for (let vn of members) {
        let item: any = {};
        item.name = vn.name;
        item.type = parseType(vn);
        item.comment = parseComment(vn.comment);
        mems.push(item);
    }
    data.name = sn.name;
    data.comment = parseTableComment(sn.comment);
    data.mems = mems;
    data.index = index;
    data.databaseSetting = {};
    data.databaseSetting.databaseName = sn.dbname || getExtendsDBName(sn.name,ast);
    data.databaseSetting.tableName = sn.name;
    data.databaseSetting.sharding = extendsFromShardDBObject(sn.name, ast);
    return data;
}

function getAllMembers(name: string, ast: AST) {
    let members: VarNode[] = [];
    let chains: StructNode[] = [];
    let index = '';
    while (true) {
        if (!name) break;
        let sn = ast.findTypeStruct(name, OUTTAG.server);
        if (!sn) break;
        chains.push(sn);
        name = sn.base;
    }
    for (let i = chains.length - 1; i >= 0; i--) {
        let sn = chains[i];
        members = members.concat(sn.members);
        if (sn.dbindex) index = sn.dbindex;
    }
    return { members, index };
}

function parseTableComment(comment: string | null) {
    return comment ? ` COMMENT='${comment}'` : '';
}

function parseComment(comment: string | null) {
    return comment ? ` COMMENT '${comment}'` : '';
}

function parseType(vn: VarNode) {
    if (vn.dbtype && vn.dbtype != '') {
        return vn.dbtype
    }
    else if (typeTable[vn.type]) {
        return typeTable[vn.type];
    }
    else {
        return "text NOT NULL";
    }
}

function getNowStr() {
    let now = new Date();
    return `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
}

