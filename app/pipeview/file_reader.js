import { readline } from "./readline.js";

class FileReader{
    constructor(){
        this.filePath_ = "";
        this.readIF_ = null;
        this.fileSize_ = 0;
        this.complete_ = false;
    }


    /**
     * Open a file
     * @param {string} filePath - a file path
     */
    open(filePath, file){
        // this.fileSize_ = file.size;
        this.filePath_ = filePath;
        this.readIF_ = readline.createInterface({filePath, file});
    }

    close(){
        if (this.readIF_){
            this.readIF_.close();
            this.readIF_ = null;
        }
    }

    getPath(){
        return this.filePath_;
    }

    /**
     * Open a file
     * @param {function(string): void} read - Called when a line is read
     * @param {function(string): void} finish - Called when all lines have been read
     */
    readlines(read, finish){
        this.readIF_.on("line", read);
        this.readIF_.on("close", finish);
    }

    getPercent () {
      return this.readIF_.getPercent()
    }
}

export {
  FileReader
}
