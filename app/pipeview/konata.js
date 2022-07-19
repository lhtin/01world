// JSDoc のタイプチェックに型を認識させるため
import { Op } from "./op.js";
import { CreateStats } from "./stats.js";
import { PipeViewLogParser } from "./pipeview_log_parser.js";
import { FileReader } from "./file_reader.js";

class Konata{
    constructor(){
        this.name = "Konata";
        /** @type {PipeViewLogParser} */
        this.parser_ = null;
        this.FileReader_ = FileReader;

        this.file_ = null;
        this.filePath_ = ""; 
        // Callback handlers
        this.updateCallback_ = null;
        this.finishCallback_ = null;
        this.errorCallback_ = null;
        this.closed_ = false;
    }

    close(){
        this.closed_ = true;
        if (this.parser_) {
            this.parser_.close();
            this.parser_ = null;
        }
        if (this.file_){
            this.file_.close();
            this.file_ = null;
            console.log(`Closed: ${this.filePath_}`);
        }
    }

    openFile(file, updateCallback, finishCallback, errorCallback){
        this.filePath_ = file.name;
        this.rawFile = file;
        this.updateCallback_ = updateCallback;
        this.finishCallback_ = finishCallback;
        this.errorCallback_ = errorCallback;

        this.reload();
    }

    reload(){
        let parsers = [
            new PipeViewLogParser()
        ];
        this.load_(parsers);
    }

    /**
     * 与えられた parser を使ってファイルのロードを試みる
     * @param {array} parsers - パーサーのリスト．先頭から順に読み出し試行される
     */
    load_(parsers){
        this.close();
        this.file_ = new this.FileReader_();
        this.file_.open(this.filePath_, this.rawFile);
        this.closed_ = false;

        this.parser_ = parsers.shift();
        console.log(`Open (${this.parser_.name}): ${this.filePath_}`);

        let self = this;
        this.parser_.setFile(
            this.file_, 
            this.updateCallback_, 
            function(){ // Finish handler
                if (self.file_) {
                    self.file_.close(); // The parser must not be closed.
                }
                self.finishCallback_();
            },
            function(){ // Error handler
                console.log("Filed to load by:", self.parser_.name);
                self.close();
                // 読み出し試行に失敗したの次のパーサーに
                if (parsers.length > 0) {
                    self.load_(parsers);
                }
                else if (parsers.length == 0) {
                    self.errorCallback_("Unsupported file format.");
                }
            }
        );
    }

    /**
     * @return {Op} id に対応した op を返す
     */
    getOp(id, resolution=0){
        return this.parser_ ? this.parser_.getOp(id, resolution) : null;
    }

    getOpFromRID(rid, resolution=0){
        return this.parser_ ? this.parser_.getOpFromRID(rid, resolution) : null;
    }

    get lastID(){
        return this.parser_ ? this.parser_.lastID : -1;
    }

    get startCycle () {
      return this.parser_ ? this.parser_.startCycle : 0;
    }

    get lastRID(){
        return this.parser_ ? this.parser_.lastRID : -1;
    }

    get laneMap(){
        return this.parser_ ? this.parser_.laneMap : {};
    }

    get stageLevelMap(){
        return this.parser_ ? this.parser_.stageLevelMap : null;
    }

    // パイプライン中の統計を計算し，終わったら finish に渡す
    async statsBody_(update, finish, statsList){
        let lastID = this.lastID;

        let sleepTimer = 0;
        let SLEEP_INTERVAL = 50000;
        let GIVE_UP_TIME = 1000;

        let stats = statsList.shift();

        for (let i = 0; i < lastID; i++) {
            let op = this.getOp(i);
            if (op == null) {
                continue;
            }
            stats.update(op);

            if (!stats.isDetected &&  i > GIVE_UP_TIME) {
                console.log(`Gave up analyzing this file (${stats.name})`);
                this.statsBody_(update, finish, statsList);
                return;
            }

            // 一定時間毎に setTimeout でその他の処理への切り替えを入れる
            if (sleepTimer > SLEEP_INTERVAL) {
                sleepTimer = 0;
                update(i / lastID, i / SLEEP_INTERVAL);
                await new Promise(r => setTimeout(r, 0));
                if (this.closed_){
                    break;
                }
            }
            sleepTimer++;
        }

        if (!stats.isDetected) {
            console.log(`Gave up analyzing this file (${stats.name})`);
            this.statsBody_(update, finish, statsList);
            return;
        }

        console.log(`Finished stats processing ('${stats.name}')`);
        stats.finish();
        finish(stats.stats);
    }
    async stats(update, finish){
        let statsList = CreateStats(this);
        this.statsBody_(update, finish, statsList);
    }

}

export {
  Konata
}
