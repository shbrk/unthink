import AST from "../../ast";
import BaseOutput from "./base";
import { ETYPE } from "../../types";
import { format } from "util";
import { VarNode, OUTTAG, FILETAG } from "../../astnode";

let typeTable: any = {};
typeTable[ETYPE.ARRAY] = 'List<%s>';
typeTable[ETYPE.BOOL] = 'bool';
typeTable[ETYPE.DOUBLE] = 'double';
typeTable[ETYPE.FLOAT] = 'float';
typeTable[ETYPE.INT] = 'int';
typeTable[ETYPE.INT64] = 'long';
typeTable[ETYPE.OBJECT] = 'object';
typeTable[ETYPE.STRING] = 'string';

let defaultTable: any = {};
defaultTable[ETYPE.ARRAY] = 'null';
defaultTable[ETYPE.BOOL] = 'false';
defaultTable[ETYPE.DOUBLE] = '0.0';
defaultTable[ETYPE.FLOAT] = '0.0f';
defaultTable[ETYPE.INT] = '0';
defaultTable[ETYPE.INT64] = '0';
defaultTable[ETYPE.OBJECT] = 'null';
defaultTable[ETYPE.STRING] = '""';


export default class CSharpOutput extends BaseOutput {

    constructor(ast: AST, outPath: string, ejsPath: string) {
        super(ast, outPath, ejsPath);
    }

    getType(t: string, subt: string[]) {
        if (t == ETYPE.ARRAY) {
            let tmp = ([t] as string[]).concat(subt);
            let item = tmp[tmp.length - 1];
            item = typeTable[item] || item;
            for (let i = tmp.length - 1; i > 0; i--) {
                let array = typeTable[tmp[i - 1]]
                item = format(array, item)
            }
            return item;
        }
        else if (typeTable[t]) {
            return typeTable[t];
        }
        else {
            return t;
        }
    }

    getDefaultVal(t: string) {
        if (defaultTable[t])
            return defaultTable[t];
        return 'null';
    }


    parseVar(vn: VarNode, ft: FILETAG) {
        let t = this.getType(vn.type, vn.subtype);
        let val = vn.value;
        if (val == null) val = this.getDefaultVal(vn.type);
        return [t, val];
    }

    doOutput() {
        let enumMap = this.ast.getEnumMap(OUTTAG.client);
        this.enumOutput(enumMap, 'SharedEnum.cs', 'csharp_enum.ejs');
        let structMap = this.ast.getStructMap(OUTTAG.client);
        this.structOutput(structMap, 'SharedStruct.cs', 'csharp_struct.ejs');
        let apiMap = this.ast.getAPIMap(OUTTAG.client);
        this.apiOutput(apiMap, 'API.cs', 'csharp_api.ejs');
    }
}
