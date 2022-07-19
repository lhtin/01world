import { Op, Dependency } from './op.js';
import { OpList } from './op_list.js';
import { Stage, Lane, StageLevelMap } from './stage.js';
import { FileReader as InternalFileReader } from './file_reader.js';

class PipeViewLogParser {

    constructor(){

        // 文件阅读器
        /** @type {InternalFileReader} */
        this.file_ = null;

        // 更新、完成和错误的回调处理程序
        this.updateCallback_ = null;
        this.finishCallback_ = null;
        this.errorCallback_ = null;

        // 当前行号
        this.curLine_ = 1;

        // 当前正在读取的 ID/周期
        this.curCycle_ = 0;

        this.startCycle = Number.POSITIVE_INFINITY;

        this.reqNum = 0; // id

        // 操作列表
        /** @type {OpList} */
        this.opListBody_ = new OpList();

        /** @type {number} --最后读取指令的ID */
        this.lastGID_ = -1; // seqNum
        this.lastNotFlushedID = -1; // 最后一条成功退出的指令的 id

        // 当前解析指令的 seq_num、刷新标志和刻度
        this.curParsingSeqNum_ = 0;
        this.curParsingInsnFlushed_ = false; // seq_num
        this.curParsingInsnCycle_ = -1; // 刷新指令时使用

        // 解析中的操作列表
        // 文件中ops的顺序几乎是随机的，所以在这里存储一次之后
        // 分配 id 并再次清除
        // 这不是连续的，所以它是一个字典
        /** @type {Object.<String, Op>} */
        this.parsingOpList_ = {};

        // 出现在 O3PipeView 以外的日志中的最后一个 SN
        this.parsingExLogLastGID_ = -1;

        // 依赖跟踪表
        /** @type {Object.<String, Op>} */
        this.depTable_ = {};
        
        // 解析完成
        this.complete_ = false;

        //出现的车道图
        this.laneMap_ = {};

        // 记录阶段出现顺序的映射
        this.stageLevelMap_ = new StageLevelMap();

        // 读取开始时间
        this.startTime_ = 0;

        // 更新间隔定时器
        this.updateTimer_ = 100; // 第一次读取100行后尝试显示一次

        // 更新处理程序调用次数
        this.updateCount_ = 0;

        // 强制终止
        this.closed_ = false;

        // GEM5 中每个时钟的滴答数 (ps)。
        // 默认值为 1000（1000 ps = 1 GHz 中的 1 个时钟）
        // 一个cycle的时间
        this.ticks_per_clock_ = 1;

        // 开始打勾
        this.cycle_begin_ = -1;

        // 起始 GID（序列号）
        this.gidBegin_ = -1;

        // O3PipeView标签是否出现
        this.isGem5O3PipeView = false;

        this.parsedTracelog = false;

        // 如果 O3PipeView 标签没有出现这个行数，则放弃
        this.GIVING_UP_LINE = 20000;

        // Stage ID
        this.STAGE_ID_FETCH_ = 0;
        this.STAGE_ID_DECODE_ = 1;
        this.STAGE_ID_RENAME_ = 2;
        this.STAGE_ID_DISPATCH_ = 3;
        this.STAGE_ID_ISSUE_ = 4;
        this.STAGE_ID_COMPLETE_ = 5;
        this.STAGE_ID_RETIRE_ = 6;
        this.STAGE_ID_MEM_COMPLETE_ = 7;

        this.STAGE_ID_MAP_ = {
            "fetch": this.STAGE_ID_FETCH_,
            "decode": this.STAGE_ID_DECODE_,
            "rename": this.STAGE_ID_RENAME_,
            "dispatch": this.STAGE_ID_DISPATCH_,
            "issue": this.STAGE_ID_ISSUE_,
            "complete": this.STAGE_ID_COMPLETE_,
            "retire": this.STAGE_ID_RETIRE_,
            "mem_complete": this.STAGE_ID_MEM_COMPLETE_   // 追加ログの解析結果より追加
        };

        this.STAGE_FULL_NAME_MAP_ = undefined;

        this.STAGE_LABEL_MAP_ = undefined;

        this.SERIAL_NUMBER_PATTERN = new RegExp("sn:(\\d+)");
    }
    
    // Public methods

    // 閉じる
    close(){
        this.closed_ = true;
        this.opListBody_.close();
        // パージ
        this.parsingOpList_ = {};
        this.depTable_ = {};
        this.laneMap_ = {};
    }

    /**
     * @return {string} パーサーの名前を返す
     */
    get name(){
        return "PiprViewLogParser";
    }

    /**
     * @param {InternalFileReader} file - ファイルリーダ
     * @param {function} updateCallback - 
     *      (percent, count): 読み出し状況を 0 から 1.0 で渡す．count は呼び出し回数
     * @param {function} finishCallback - 終了時に呼び出される
     * @param {function} errorCallback - エラー時に呼び出される
     */
    setFile(file, updateCallback, finishCallback, errorCallback){
        this.file_ = file;
        this.updateCallback_ = updateCallback;
        this.finishCallback_ = finishCallback;
        this.errorCallback_ = errorCallback;
        this.startTime_ = (new Date()).getTime();

        this.startParsing();
        file.readlines(
            this.parseLine.bind(this), 
            this.finishParsing.bind(this)
        );
    }

    getOp(id, resolution=0){
        return this.opListBody_.getParsedOp(id, resolution);
    }
    
    getOpFromRID(rid, resolution=0){
        return this.opListBody_.getParsedOpFromRID(rid, resolution);
    }

    get lastID(){
        return this.opListBody_.parsedLastID;
    }

    get lastRID(){
        return this.opListBody_.parsedLastRID;
    }

    /** @returns {Object.<string, number>} */
    get laneMap(){
        return this.laneMap_;
    }

    get stageLevelMap(){
        return this.stageLevelMap_;
    }

    /** @returns {number} */
    get lastCycle(){
        return this.curCycle_;
    }

    startParsing(){
        this.complete_ = false;
        this.curCycle_ = 0;
    }

    parseOneLog (log, id) {
      // console.log(log)
      const [gid, cycle, pc, code] = log.m.split(":");
      let op = new Op();
      op.id = id; // この段階ではまだ未定
      op.gid = Number(gid);
      op.tid = 0;
      const stages = log.stages.split(":").map((item) => item.split(","));
      op.fetchedCycle = Number(cycle);
      op.line = this.curLine_++;
      op.labelName += `${pc}: ${log.disasm}`;
      op.labelDetail += `Fetched Tick: ${op.fetchedCycle}`;
      if (log.tags) {
        log.tags.split(":").map((item) => item.split("|")).forEach(([cycle, tag]) => {
          op.tags[op.fetchedCycle + Number(cycle)] = tag;
        })
      }
      // console.log(op.tags)

      this.curParsingInsnCycle_ = op.fetchedCycle;
      this.startCycle = Math.min(this.startCycle, op.fetchedCycle)

      let laneName = "0";
      this.laneMap_[laneName] = 1;
      let lane = new Lane();
      op.lanes[laneName] = lane;
      const stagesLength = stages.length
      for (let i = 0; i < stagesLength - 1; i += 1) {
        let item = stages[i];
        let stage = new Stage();
        stage.name = item[0];
        stage.fullName = this.STAGE_FULL_NAME_MAP_[this.STAGE_LABEL_MAP_.indexOf(stage.name)];
        stage.startCycle = op.fetchedCycle + Number(item[1]);
        stage.endCycle = op.fetchedCycle + Number(stages[i + 1][1]);
        lane.stages.push(stage);
        this.stageLevelMap_.update(laneName, stage.name, lane);
        lane.level++;
      }
      const lastStage = stages[stagesLength - 1]
      if (lastStage[0] === "FL") {
        op.flush = true;
        op.retired = false;
        op.retiredCycle = op.fetchedCycle + Number(lastStage[1])
      } else if (lastStage[0] === "CM") {
        op.flush = false;
        op.retired = true;
        op.retiredCycle = op.fetchedCycle + Number(lastStage[1])
      } else {
        console.log("lastStage", lastStage);
        throw new Error("last stage must be Retire or Flush.")
      }
      return op;
    }

    checkMeta(meta) {
      if (!meta.stages.includes("Flush") || !meta.stages.includes("Retire")) {
        console.log("meta", meta);
        throw new Error("Stage must have Flush and Retire stages.");
      }
    }

    getSeqNum() {
      return this.reqNum++;
    }

    /**
     * @param {string} line 
     */
    parseLine(line){
        if (this.closed_) {
            // Node.js はファイル読み出しが中断されクローズされた後も，
            // バッファにたまっている分はコールバック読み出しを行うため，
            // きちんと無視する必要がある
            return;
        }

        // console.log('line', line);
        
        if (line.startsWith("meta:")) {
          this.isGem5O3PipeView = true;
          const meta = window.jsyaml.load(line).meta;
          this.checkMeta(meta);
          this.STAGE_LABEL_MAP_ = meta.shortStages;
          this.STAGE_FULL_NAME_MAP_ = meta.stages;
          return;
        } else if (line.startsWith("traceLog:")) {
          this.parsedTracelog = true
          return;
        }

        if (!this.parsedTracelog) {
          return;
        }

        const log = window.jsyaml.load(line)[0]

        // console.log(log)

        const op = this.parseOneLog(log, this.getSeqNum())
        if (op.retiredCycle > this.curCycle_) {
          this.curCycle_ = op.retiredCycle;
        }
        
        this.opListBody_.setOp(op.id, op);
        this.opListBody_.setParsedLastID(op.id);
        if (!op.flush) {
          op.rid = this.opListBody_.parsedLastRID + 1;
          this.opListBody_.setParsedRetiredOp(op.rid, op);
          this.lastNotFlushedID = this.opListBody_.parsedLastID;
        } else { // in a flushing phase
            // Dummy RID
            op.rid = this.opListBody_.parsedLastRID + this.lastID - this.lastNotFlushedID;
        }
        this.updateTimer_--;
        if (this.updateTimer_ < 0) {
            this.updateTimer_ = 1024*16;

            // Call update callback, which updates progress bars 
            this.updateCallback_(
                this.file_.getPercent(),
                this.updateCount_
            );
            this.updateCount_++;

            if (this.isGem5O3PipeView) {
                // this.drainParsingOps_(false);
            }
        }
    }

    finishParsing() {
        if (this.closed_) {
            return;
        }

        let elapsed = ((new Date()).getTime() - this.startTime_);

        this.updateCallback_(1.0, this.updateCount_);
        this.finishCallback_();

        // Release
        this.parsingOpList_ = {};
        this.depTable_ = {};

        console.log(`Parsed (${this.name}): ${elapsed} ms`);
    }
}

export {
  PipeViewLogParser
}
