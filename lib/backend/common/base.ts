import * as path from 'path';
import * as fs from 'fs';
import AST from '../../ast';
import { EnumNode, StructNode, VarNode, OUTTAG, APINode, FILETAG } from '../../astnode';
import { render as rawRender, getTimeString } from '../../helper';


export default class BaseOutput {
    outPath: string;
    ejsPath: string;
    ast: AST;

    constructor(ast: AST, outPath: string, ejsPath: string) {
        this.outPath = outPath;
        this.ejsPath = ejsPath;
        this.ast = ast;
    }

    doOutput(enumOut = true, structOut = true, apiOut = true) {
    }

    render(fileName: string, ejsName: string, data: {}) {
        rawRender(fileName, ejsName, data, this.ejsPath, this.outPath);
    }

    parseComment(comment: string | null) {
        return comment ? `//${comment}` : '';
    }

    parseExtends(base: string | null) {
        return base ? ` extends ${base}` : '';
    }

    parseVar(vn: VarNode, ft: FILETAG) {
        return [vn.type, vn.value];
    }



    parseEnumData(map: Map<string, EnumNode>) {
        let data: any = {};
        data.enums = [];
        data.enums_mix = [];
        let now = new Date();
        data.time = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;

        for (let en of map.values()) {
            let node: any = {};
            node.name = en.name;
            node.comment = this.parseComment(en.comment);
            node.mems = [];
            for (let vn of en.members) {
                let [t, val] = this.parseVar(vn, FILETAG.Enum);
                let v: any = {};
                v.name = vn.name;
                v.type = t;
                v.value = val;
                v.comment = this.parseComment(vn.comment);
                node.mems.push(v);
            }
            if (en.ismix)
                data.enums_mix.push(node);
            else
                data.enums.push(node);
        }
        return data;
    }

    enumOutput(map: Map<string, EnumNode>, fileName: string, ejsName: string) {
        let data = this.parseEnumData(map);
        this.render(fileName, ejsName, data);
    }

    parseStructData(map: Map<string, StructNode>) {
        let data: any = {};
        data.structs = [];
        let now = new Date();
        data.time = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;

        for (let sn of map.values()) {
            let node: any = {};
            node.name = sn.name;
            node.comment = this.parseComment(sn.comment);
            node.mems = [];
            node.base = this.parseExtends(sn.base);
            if (!sn.nodb && this.extendsFromDBObject(sn.name)) {
                node.databaseSetting = {};
                node.databaseSetting.databaseName = sn.dbname;
                node.databaseSetting.tableName = sn.name;
                node.databaseSetting.sharding = this.extendsFromShardDBObject(sn.name);
            }
            for (let vn of sn.members) {
                let [t, val] = this.parseVar(vn, FILETAG.Struct);
                let v: any = {};
                v.name = vn.name;
                v.type = t;
                v.value = val;
                v.comment = this.parseComment(vn.comment);
                node.mems.push(v);
            }
            data.structs.push(node);
        }
        return data;
    }

    structOutput(map: Map<string, StructNode>, fileName: string, ejsName: string) {
        let data = this.parseStructData(map);
        this.render(fileName, ejsName, data);
    }

    parseAPIData(map: Map<string, APINode>) {
        let data: any = {};
        data.apis = new Map<string, Array<any>>();
        let now = new Date();
        data.time = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;

        for (let an of map.values()) {
            let list = data.apis.get(an.mod)
            if (!list) {
                list = new Array<any>();
                data.apis.set(an.mod, list);
            }

            let node: any = {};
            node.name = an.name;
            node.comment = this.parseComment(an.comment);
            if (an.req) {
                node.req = {};
                node.req.comment = this.parseComment(an.req.comment);
                node.req.args = [];
                node.reqArgs = '';
                for (let vn of an.req.args) {
                    let [t, val] = this.parseVar(vn, FILETAG.API);
                    let v: any = {};
                    v.name = vn.name;
                    v.type = t;
                    v.value = val;
                    v.comment = this.parseComment(vn.comment);
                    node.req.args.push(v);
                    node.reqArgs = `${node.reqArgs}, ${v.type} ${v.name}`;
                }
                if (node.reqArgs.length > 2) node.reqArgs = node.reqArgs.substr(2);
            }

            if (an.res) {
                node.res = {};
                node.res.comment = this.parseComment(an.res.comment);
                node.res.args = [];
                node.resArgs = '';
                for (let vn of an.res.args) {
                    let [t, val] = this.parseVar(vn, FILETAG.API);
                    let v: any = {};
                    v.name = vn.name;
                    v.type = t;
                    v.value = val;
                    v.comment = this.parseComment(vn.comment);
                    node.res.args.push(v);
                    node.resArgs = `${node.resArgs}, ${v.type} ${v.name}`;
                }
                if (node.resArgs.length > 2) node.resArgs = node.resArgs.substr(2);
            }

            list.push(node);
        }
        return data;
    }

    apiOutput(map: Map<string, APINode>, fileName: string, ejsName: string) {
        let data = this.parseAPIData(map)
        data.time = getTimeString(new Date());
        this.render(fileName, ejsName, data);
    }

    extendsFrom(name: string, parents: string[]) {
        while (true) {
            let sn = this.ast.findTypeStruct(name, OUTTAG.server);
            if (!sn || !sn.base) return false;
            if (parents.indexOf(sn.base) !== -1) return true;
            name = sn.base;
        }
    }

    extendsFromDBObject(name: string) {
        return this.extendsFrom(name, ["DBBase", "DBObject", "ShardDBObject"]);
    }

    extendsFromShardDBObject(name: string) {
        return this.extendsFrom(name, ["ShardDBObject"]);
    }
}