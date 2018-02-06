import * as path from 'path';
import * as fs from "fs";
import * as ejs from 'ejs';

export function try2mkdir(dirpath: string) {
    let list = [dirpath];
    while (true) {
        if (list.length == 0) break;
        let dir = list.pop() as string;
        if (!fs.existsSync(dir)) {
            let parent = path.dirname(dir);
            if (fs.existsSync(parent)) {
                fs.mkdirSync(dir);
            }
            else {
                list.push(dir);
                list.push(parent);
            }
        }
    }
};

export function render(fileName: string, ejsName: string, data: {}, ejsPath: string, outPath: string) {
    let ejsFilePath = path.join(ejsPath, ejsName);
    let temp = fs.readFileSync(ejsFilePath, { encoding: 'utf-8' });
    let content = ejs.render(temp, data, { compileDebug: true });
    let outFilePath = path.join(outPath, fileName)
    fs.writeFileSync(outFilePath, content, { encoding: 'utf-8' });
}