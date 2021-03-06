import { Console } from 'console';
import fs from 'fs';
import path from 'path';

import { Generate } from './generate';

const terminalConsole = new Console(process.stdout, process.stderr);


/**
 * Get all files in folder, recursively.
 * @param {string} folder folder path
 * @param {array} ignoreFilesList an array of files to be ignored
 */
function deepListFiles(folder: string, ignoreFilesList: string[]): string[] {
    const files: string[] = [];
    const filesList = fs.readdirSync(folder);
    filesList.forEach((file) => {
        if (ignoreFilesList.includes(file)) {
            return;
        }
        const stats = fs.lstatSync(path.join(folder, file));
        if (stats.isDirectory()) {
            const result = deepListFiles(path.join(folder, file), ignoreFilesList);
            result.forEach((r) => files.push(r));
            return;
        }
        if (path.extname(file) === '.sol') {
            files.push(path.join(folder, file));
        }
    });
    return files;
}

/**
 * Main method to be called. Will create the HTML using the other methods.
 * @param {string} outputType the output type of the given documentation
 * @param {string} ignoreFilesList an array of files to be ignored
 * @param {string} outputFolder directory to output the result, either pdf or html
 * @param {string} inputPath the path to file or folder to be analized
 * @param {string} baseLocation the project's base location
 */
export function generate(
    outputType: string,
    ignoreFilesList: string[],
    outputFolder: string,
    inputPath: string,
    baseLocation: string,
): number {
    let stats;
    try {
        stats = fs.lstatSync(inputPath);
    } catch (e) {
        terminalConsole.log(`The file you are looking for (${inputPath}) doesn't exist!`);
        return 1;
    }

    let files: string[] = [];
    // verify if the input is a directory, file or array of files
    if (stats.isDirectory()) {
        files = deepListFiles(inputPath, ignoreFilesList);
    } else if (stats.isFile() && !ignoreFilesList.includes(inputPath)) {
        files.push(inputPath);
    }
    const destinationDocsFolderPath = path.join(process.cwd(), outputFolder);
    if (!fs.existsSync(destinationDocsFolderPath)) {
        fs.mkdirSync(destinationDocsFolderPath, { recursive: true });
    }
    const generateClass = new Generate(
        files,
        ignoreFilesList,
        inputPath,
        outputFolder,
        baseLocation,
    );
    if (outputType === 'gitbook') {
        generateClass.gitbook();
    } else {
        terminalConsole.error('Invalid output type! Try --help for more info.');
        return 1;
    }
    return 0;
}
