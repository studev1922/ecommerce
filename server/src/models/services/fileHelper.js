import fs from 'fs';
import env from 'dotenv';
import multer from "multer";

const properties = env.config().parsed;
const {SOURCE, STATIC_FOLDER} = properties;

export class FileHelper {

    constructor(path) {
        this.dest = `${SOURCE}/${STATIC_FOLDER}${path}`;
        if (!fs.existsSync(this.dest)) fs.mkdirSync(this.dest, { recursive: true });
        this.upload = multer({ dest: this.dest });
    }

    readFile = (fileName) => fs.readFileSync(`${this.dest}/${fileName}`);
    readAll = () => fs.readdirSync(this.dest);
    remove = (fileName) => fs.unlinkSync(`${this.dest}/${fileName}`);
    multipleRemove = (fileNames) => {
        const status = { deleted: [], error: [] };
        if (Array.isArray(fileNames))
            for (const fileName of fileNames)
                try {
                    this.remove(fileName);
                    status.deleted.push(fileName);
                } catch (error) {
                    status.error.push(fileName)
                }
        else try {
            this.remove(fileNames);
            status.deleted.push(fileNames);
        } catch (error) {
            status.error.push(fileNames);
        }
        return status;
    }
}
/**
 * 
 * @param {Express} application 
 * @param {string} path the first path api
 * @param {string || Array} folder to concat with first path
 */
const fileHelperAPI = (application, path, folder) => {
    if(!folder) return;
    else if(Array.isArray(folder)) folder = folder.join();
    const file = new FileHelper(folder);
    const pathAPI = `${path}${folder}`;
    
    application
        .get(pathAPI, (_req, res) => res
            .status(200).json(file.readAll())
        )
        .post(pathAPI, file.upload.any(), (req, res) => res
            .status(200).json(req['files'].map(e => `${folder}/${e.filename}`))
        )
        .delete(`${path}${folder}/:fileName`, (req, res) => {
            const json = { message: undefined }, { fileName } = req.params;
            try {
                res.status(200);
                file.remove(fileName);
                json.message = `${fileName} deleted.`;
            } catch (error) {
                res.status(404);
                // console.error(error);
                json.message = `${fileName} does not exist!`;
            } finally {
                return res.json(json);
            }
        })
        .delete(pathAPI, (req, res) => {
            const fileNames = req.query['fn'] || req.body['images'];
            if (Array.isArray(fileNames)) {
                const status = file.multipleRemove(fileNames);
                res.status(200).json(status);
            } else res.status(406).json({ message: 'file-names must be an array' });
            return res;
        });
}

/**
 * create multiple API router
 * @param {Express} application 
 * @param path is the first path api
 * @param  {string || Array<string>} folders 
 */
const fileHelperAPIs = (application, path, ...folders) => folders.forEach(folder => fileHelperAPI(application, path, folder));

export { fileHelperAPI, fileHelperAPIs }
export default (packages) => new FileHelper(packages);
