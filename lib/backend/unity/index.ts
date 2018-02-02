/*
 * @Author: shenzhengyi 
 * @Date: 2018-02-01 17:51:31 
 * @Last Modified by: shenzhengyi
 * @Last Modified time: 2018-02-02 16:15:18
 */

import AST from "../../ast";
import * as path from 'path';
import * as fs from 'fs';
import CSharpOutput from "../common/csharp";

export default function (ast: AST, outPath: string, ejsPath: string) {
    let cs = new CSharpOutput(ast, outPath, ejsPath);
    cs.doOutput();

    let outFile = path.join(outPath, 'ServerContext.cs');
    let srcFile = path.join(ejsPath, 'ServerContext.cs');
    if (!fs.existsSync(outFile)) fs.copyFileSync(srcFile, outFile);
}