// JSDoc のタイプチェックに型を認識させるため
import { Stage, Lane } from './stage.js';

class Op{
    constructor(){
        //文件中的ID
        // Konata 中的识别是通过这个 ID 完成的
        this.id = -1; 

        this.gid = -1; // 模拟器上的全局 ID
        this.rid = -1; // 模拟器上的退休 ID
        this.tid = -1; // 模拟器上的线程 ID
        
        this.retired = false; // 是否退休
        this.flush = false; // 是否为 Flush
        
        this.eof = false; // 以文件结尾结尾
        /** @type {Object <string, Lane>} */
        this.lanes = {}; // 车道信息关联数组
        this.fetchedCycle = -1;
        this.retiredCycle = -1;

        this.line = 0; // 行号
        
        this.labelName = ""; // 反汇编窗格的注释
        this.labelDetail = ""; // 管道窗格的注释
        //this.labelStage = {}; // 每个阶段的标签
        
        /** @type {Stage} */
        this.lastParsedStage = null;
        this.lastParsedCycle = -1;

        /** @type {Array <Dependency>} prods --生产者指令ID数组 */
        this.prods = [];

        /** @type {Array <Dependency>} cons --消费者指令ID数组 */
        this.cons = [];

        // 用于绘制依赖
        this.prodCycle = -1; // 开始执行阶段
        this.consCycle = -1; // 执行阶段完成
        this.tags = {}; // 标记，比如stall原因
        this.searched = false;
    }
}

class Dependency{
    /** 
     * @param {number} opID 
     * @param {number} type
     * @param {number} cycle
     * */
    constructor(opID, type, cycle) {
        this.opID = opID;
        this.type = type;
        this.cycle = cycle;
    }
}

export {
  Op,
  Dependency
}