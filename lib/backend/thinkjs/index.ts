/*
 * @Author: shenzhengyi 
 * @Date: 2018-02-01 17:51:24 
 * @Last Modified by: shenzhengyi
 * @Last Modified time: 2018-02-26 20:23:25
 */

import AST from "../../ast";
import * as path from 'path';
import TypeScriptOutput from "../common/typescript";
import { OUTTAG } from "../../astnode";
import { try2mkdir } from "../../helper";
import TsSimpleAst, { ClassDeclaration, MethodDeclarationStructure, VariableDeclarationType, Expression, ExpressionWithTypeArguments, ImportExpression, SourceFile, MethodDeclaration } from 'ts-simple-ast';


export default function (ast: AST, conf: any, ejsPath: string) {
    let outPath = typeof conf == 'string' ? conf : conf.path;
    outPath = path.join(outPath, 'src');
    ejsPath = path.join(ejsPath, 'typescript');
    let tsOutPath = path.join(outPath, 'protocol');
    try2mkdir(tsOutPath);
    let ts = new TypeScriptOutput(ast, tsOutPath, ejsPath,OUTTAG.server);
    ts.doOutput();

    try { controllerOutput(ast, outPath, ejsPath); } catch (e) { console.log(e); };
}

function checkImport(sf: SourceFile, mod: string, specifier: string = '../protocol/API', isDefaultExport = false) {
    let importd = sf.getImport(importDeclaration => { return importDeclaration.getModuleSpecifier() == specifier; });
    if (!importd) { importd = sf.addImportDeclaration({ moduleSpecifier: specifier }); }
    if (!isDefaultExport) {
        let impordNames = importd.getNamedImports();
        let hasImported = false;
        for (let imName of impordNames) { if (mod == imName.getNameNode().getText()) hasImported = true; break; }
        if (!hasImported) { importd.insertNamedImport(0, { name: mod }) }
    }
    else {
        let defaultImport = importd.getDefaultImport();
        if (!defaultImport) importd.setDefaultImport(mod);
    }


}

function checkClass(sf: SourceFile) {
    let astClass;
    for (let c of sf.getClasses()) { if (c.isDefaultExport()) astClass = c; }
    if (!astClass) { astClass = sf.addClass({ name: 'Controller', extends: 'Base', isDefaultExport: true }); }
    return astClass;
}


function checkFunction(astClass: ClassDeclaration, mod: string, name: string, comment: string | null) {
    let funcName = `${name}Action`;
    let method = astClass.getInstanceMethod(funcName);
    if (!method) {
        let mds: MethodDeclarationStructure = {
            name: funcName,
            isAsync: true,
            isAbstract: false
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
                initializer: `<${mod}.${name}Request>(<any>this.post()).data`
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
        let sf = tsAST.getSourceFile(fileName);
        if (!sf) {
            sf = tsAST.addSourceFileIfExists(fileName) || tsAST.createSourceFile(fileName);
        }
        checkImport(sf, an.mod);
        checkImport(sf, "think", "thinkjs");
        checkImport(sf, 'Base', './base', true);
        checkFunction(checkClass(sf), an.mod, an.name, an.comment);
    }

    let sfs = tsAST.getSourceFiles();
    for (let sf of sfs) {
        sf.saveSync();
        console.log(path.normalize(sf.getFilePath()));
    }
}
