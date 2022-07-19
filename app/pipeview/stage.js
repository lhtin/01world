class Stage{
    constructor(){
        this.fullName = "";
        this.name = "";
        /** @type {string} */
        this.labels = "";
        this.startCycle = 0; // 开始cycle
        this.endCycle = 0; // 结束cycle
        this.stallCycle = []
        this.stallReason = []
    }
}

class StageLevel{
    constructor(){
        this.appearance = 0;    // The order of appearance
        this.unique = 0;        // Different levels are assigned to all levels 
    }
}

class StageLevelMap{
    constructor(){
        /** @type {Object.<string, Object.<string, StageLevel>>} */
        this.map_ = {};
        /** @type {Object.<string, number>} */
        this.laneID_Map = {};
    }

    get(laneName, stageName){
        return this.map_[laneName][stageName];
    }

    has(laneName, stageName){
        return (laneName in this.map_) && (stageName in this.map_[laneName]);
    }

    /** @param {string} laneName
     * @param {string} stageName
     * @param {Lane} lane
    */
    update(laneName, stageName, lane){
        if (this.has(laneName, stageName)) {
            if (this.map_[laneName][stageName].appearance > lane.level) {
                this.map_[laneName][stageName].appearance = lane.level;
            }
        }
        else{
            if (!(laneName in this.map_)) {
                this.map_[laneName] = {};
                this.laneID_Map[laneName] = Object.keys(this.laneID_Map).length;

                // 由于车道数量增加，因此重新分配 ID
                let i = 0;
                for (let key in Object.keys(this.laneID_Map).sort()) {
                    this.laneID_Map[key] = i;
                    i++;
                }
            }
            let level = new StageLevel;
            level.appearance = lane.level;
            level.unique = Object.keys(this.map_[laneName]).length;
            this.map_[laneName][stageName] = level;

        }
    }

    get laneNum(){
        return Object.keys(this.laneID_Map).length;
    }

    getLaneID(laneName){
        return this.laneID_Map[laneName];
    }
}

class Lane{
    constructor(){
        this.level = 0;  // 1サイクル以上のステージの数
        /** @type {Array<Stage>} */
        this.stages = [];
    }
}

export {
  Stage,
  StageLevel,
  StageLevelMap,
  Lane
}
