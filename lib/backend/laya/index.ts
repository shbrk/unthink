/*
 * @Author: shenzhengyi 
 * @Date: 2018-02-01 17:51:24 
 * @Last Modified by: shenzhengyi
 * @Last Modified time: 2018-02-02 15:04:31
 */

import AST from "../../ast";
import * as path from 'path';
import { try2mkdir } from "../../helper";
import TypeScriptOutput from "../common/typescript";
import { OUTTAG } from "../../astnode";

export default function (ast: AST, conf: any, ejsPath: string) {
    let outPath = typeof conf == 'string' ? conf : conf.path;
    outPath = path.join(outPath, 'src');
    ejsPath = path.join(ejsPath, 'laya');
    let tsOutPath = path.join(outPath, 'protocol');
    try2mkdir(tsOutPath);
    let ts = new TypeScriptOutput(ast, tsOutPath, ejsPath,OUTTAG.client);
    ts.doOutput();
}


