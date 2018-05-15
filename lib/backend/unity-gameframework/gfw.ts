import CSharpOutput from "../common/csharp";
import { APINode, FILETAG, OUTTAG, EnumNode, StructNode } from "../../astnode";
import { getTimeString } from "../../helper";
import * as fs from 'fs';
import * as path from 'path';
import AST from "../../ast";


export default class GFW extends CSharpOutput {

    namespaceStr: string;

    constructor(ast: AST, outPath: string, ejsPath: string, namespaceStr: string) {
        super(ast, outPath, ejsPath);
        this.namespaceStr = namespaceStr;
    }


    enumOutput(map: Map<string, EnumNode>, fileName: string, ejsName: string) {
        let data = this.parseEnumData(map);
        data.namespace = this.namespaceStr;
        this.render(fileName, ejsName, data);
    }

    structOutput(map: Map<string, StructNode>, fileName: string, ejsName: string) {
        let data = this.parseStructData(map);
        data.namespace = this.namespaceStr;
        this.render(fileName, ejsName, data);
    }

    apiOutput(map: Map<string, APINode>, fileName: string, ejsName: string) {
        let data = this.parseAPIData(map);
        let apis = data.apis;
        this.outputPacket(apis, 'Packet', 'packet.ejs');
        this.outputPacketHandler(apis, 'PacketHandler', 'handler.ejs');
     //   this.outputEvent('Event', 'event.ejs');
    }


    outputEvent(pathName: string, ejsName: string) {
        let fn = path.join(pathName, 'CommonEventArgs.cs');
        if (fs.existsSync(path.join(this.outPath, fn))) return;
        let data: any = {};
        data.time = getTimeString(new Date());
        data.namespace = this.namespaceStr;
        this.render(fn, ejsName, data);
    }


    outputPacket(apis: Map<string, Array<any>>, pathName: string, ejsName: string) {
        let now = new Date();
        let time = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
        for (let [k, v] of apis.entries()) {
            let data: any = {};
            data.time = getTimeString(new Date());
            data.list = v;
            data.namespace = this.namespaceStr;
            data.fn = k;
            this.render(`${pathName}/${k}.cs`, ejsName, data);
        }
    }

    outputPacketHandler(apis: Map<string, Array<any>>, pathName: string, ejsName: string) {

        for (let [k, v] of apis.entries()) {
            for (let node of v) {
                let data: any = {};
                data.time = getTimeString(new Date());
                data.node = node;
                data.namespace = this.namespaceStr;
                data.fn = k;

                let fn = path.join(pathName, `${k}/${node.upperName}Handler.cs`);
                if (fs.existsSync(path.join(this.outPath, fn))) continue;
                this.render(fn, ejsName, data)
            }
        }
    }

    doOutput(enumOut = true, structOut = true, apiOut = true) {
        if (enumOut) {
            let enumMap = this.ast.getEnumMap(OUTTAG.client);
            for (let [k, v] of enumMap.entries()) {
                let map = new Map<string, EnumNode>();
                map.set(k, v);
                this.enumOutput(map, `Protocol/Enum/${k}.cs`, 'enum.ejs');
            }
        }
        if (structOut) {
            let structMap = this.ast.getStructMap(OUTTAG.client);
            for (let [k, v] of structMap.entries()) {
                let map = new Map<string, StructNode>();
                map.set(k, v);
                this.structOutput(map, `Protocol/Struct/${k}.cs`, 'struct.ejs');
            }
        }
        if (apiOut) {
            let apiMap = this.ast.getAPIMap(OUTTAG.client);
            this.apiOutput(apiMap, '', '');
        }
    }
}