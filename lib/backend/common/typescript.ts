import AST from "../../ast";
import BaseOutput from "./base";
import { ETYPE } from "../../types";
import { format } from "util";
import { VarNode, OUTTAG, FILETAG } from "../../astnode";

let typeTable: any = {};
typeTable[ETYPE.ARRAY] = 'Array<%s>';
typeTable[ETYPE.BOOL] = 'boolean';
typeTable[ETYPE.DOUBLE] = 'number';
typeTable[ETYPE.FLOAT] = 'number';
typeTable[ETYPE.INT] = 'number';
typeTable[ETYPE.INT64] = 'number';
typeTable[ETYPE.OBJECT] = 'object';
typeTable[ETYPE.STRING] = 'string';

let defaultTable: any = {};
defaultTable[ETYPE.ARRAY] = 'null';
defaultTable[ETYPE.BOOL] = 'false';
defaultTable[ETYPE.DOUBLE] = '0.0';
defaultTable[ETYPE.FLOAT] = '0.0';
defaultTable[ETYPE.INT] = '0';
defaultTable[ETYPE.INT64] = '0';
defaultTable[ETYPE.OBJECT] = 'null';
defaultTable[ETYPE.STRING] = '""';



export default class TypeScriptOutput extends BaseOutput {

    constructor(ast: AST, outPath: string, ejsPath: string) {
        super(ast, outPath, ejsPath);
    }

    getType(t: string, subt: string[], ft: FILETAG) {
        if (t == ETYPE.ARRAY) {
            let tmp = ([t] as string[]).concat(subt);
            let item = tmp[tmp.length - 1];

            if (this.ast.findTypeEnum(item)) {
                item = ft == FILETAG.Enum ? item : `SE.${item}`;
            }
            else if (this.ast.findTypeStruct(item)) {
                item = ft == FILETAG.Struct ? item : `SS.${item}`;
            }
            else if (typeTable[item]) {
                item = typeTable[item];
            }
            else {
                throw new Error(`cannot find array type ${item}`);
            }

            for (let i = tmp.length - 1; i > 0; i--) {
                let array = typeTable[tmp[i - 1]]
                item = format(array, item)
            }
            return item;
        }
        else if (t == ETYPE.OBJECT) {
            return t;
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
        let t = this.getType(vn.type, vn.subtype, ft);
        let val = vn.value;
        if (val == null) val = this.getDefaultVal(vn.type);

        if (this.ast.findTypeEnum(vn.type)) {
            t = ft == FILETAG.Enum ? t : `SE.${t}`;
        }
        else if (this.ast.findTypeStruct(vn.type)) {
            t = ft == FILETAG.Struct ? `${t} | null` : `SS.${t} | null`;
        }
        else if (vn.type == ETYPE.OBJECT || vn.type == ETYPE.ARRAY) {
            t = `${t} | null`;
        }

        return [t, val];
    }

    doOutput() {
        let enumMap = this.ast.getEnumMap(OUTTAG.server);
        this.enumOutput(enumMap, 'SharedEnum.ts', 'typescript_enum.ejs');
        let structMap = this.ast.getStructMap(OUTTAG.server);
        this.structOutput(structMap, 'SharedStruct.ts', 'typescript_struct.ejs');
        let apiMap = this.ast.getAPIMap(OUTTAG.server);
        this.apiOutput(apiMap, 'API.ts', 'typescript_api.ejs');
    }
}
