/*
 * @Author: shenzhengyi 
 * @Date: 2018-02-01 17:51:24 
 * @Last Modified by: shenzhengyi
 * @Last Modified time: 2018-02-06 19:47:09
 */

import AST from "../../ast";
import * as path from 'path';
import TypeScriptOutput from "../common/typescript";
import { OUTTAG } from "../../astnode";
import { try2mkdir } from "../../helper";
import TsSimpleAst, { ClassDeclaration, MethodDeclarationStructure, VariableDeclarationType, Expression, ExpressionWithTypeArguments, ImportExpression, SourceFile, MethodDeclaration } from 'ts-simple-ast';


export default function (ast: AST, outPath: string, ejsPath: string) {
    outPath = path.join(outPath, 'src');
    let tsOutPath = path.join(outPath, 'network');
    try2mkdir(tsOutPath);
    let ts = new TypeScriptOutput(ast, tsOutPath, ejsPath);
    ts.doOutput();
    controllerOutput(ast, outPath, ejsPath);
}

function checkImport(sf: SourceFile, mod: string, specifier: string = '../network/api') {
    let importd = sf.getImport(importDeclaration => { return importDeclaration.getModuleSpecifier() == specifier; });
    if (!importd) { importd = sf.addImportDeclaration({ moduleSpecifier: specifier }); }
    let impordNames = importd.getNamedImports();
    let hasImported = false;
    for (let imName of impordNames) { if (mod == imName.getNameNode().getText()) hasImported = true; break; }
    if (!hasImported) { importd.insertNamedImport(0, { name: mod }) }
}

function checkClass(sf: SourceFile) {
    let astClass;
    for (let c of sf.getClasses()) { if (c.isDefaultExport()) astClass = c; }
    if (!astClass) { astClass = sf.addClass({ name: 'Controller', extends: 'think.Controller', isDefaultExport: true }); }
    return astClass;
}


function checkFunction(astClass: ClassDeclaration, mod: string, name: string, comment: string | null) {
    let funcName = `${name}Action`;
    let method = astClass.getInstanceMethod(funcName);
    if (!method) {
        let mds: MethodDeclarationStructure = {
            name: funcName,
            isAsync: true,
        };
        method = astClass.addMethod(mds);
        method.setBodyText(writer => {
            writer.writeLine('this.success(resData);');
        });

        if (comment) { method.addJsDoc({ description: comment }); }
    }
    checkVar(method, mod, name);
}


function checkVar(method: MethodDeclaration, mod: string, name: string) {
    let reqVar = method.getVariableDeclaration('reqData');
    if (!reqVar) {
        method.insertVariableStatement(0, {
            declarationType: VariableDeclarationType.Const,
            declarations: [{
                name: 'reqData',
                initializer: `<${mod}.${name}Request>this.post()`
            }]
        });
    }

    let resVar = method.getVariableDeclaration('resData');
    if (!resVar) {
        method.insertVariableStatement(-1, {
            declarationType: VariableDeclarationType.Const,
            declarations: [{
                name: 'resData', initializer: `new ${mod}.${name}Response()`
            }]
        });
    }
}

function controllerOutput(ast: AST, outPath: string, ejsPath: string) {
    let map = ast.getAPIMap(OUTTAG.server);
    const tsAST = new TsSimpleAst({ addFilesFromTsConfig: false });
    for (let an of map.values()) {
        let fileName = path.join(outPath, 'controller', `${an.mod}.ts`);
        try2mkdir(path.dirname(fileName));
        let sf = tsAST.addSourceFileIfExists(fileName) || tsAST.createSourceFile(fileName);
        checkImport(sf, an.mod);
        checkFunction(checkClass(sf), an.mod, an.name, an.comment);
        sf.saveSync();
    }
}
