// JSDoc のタイプチェックに型を認識させるため
import { Konata } from './konata.js';
import { Config } from './config.js';
import { Op } from './op.js';

let DEP_ARROW_TYPE = {
    INSIDE_LINE: "insideLine",
    LEFT_SIDE_CURVE: "leftSideCurve",
    NOT_SHOW: "notShow"
};

class KonataRenderer{

    constructor(labelCanvas, pipelineCanvas, shadow = false){
        this.labelCanvas = labelCanvas
        this.pipelineCanvas = pipelineCanvas
        this.changed = false;
        this.name = "KonataRenderer";

        // 現在の論理位置
        // この論理位置の単位は，横がサイクル数，縦が命令数となっている
        this.viewPos_ = {
            left: NaN,
            top: 0
        };

        this.shadow = shadow;

        // 依存関係の矢印のタイプ
        this.depArrowType_ = DEP_ARROW_TYPE.INSIDE_LINE;

        // 表示系
        this.ZOOM_RATIO_ = 1;   // 一回に拡大縮小する率 (2^ZOOM_RATIO)
        
        /** @type {Konata} */
        this.konata_ = null;

        /** @type {Config} */
        this.config = null;
        this.colorScheme_ = "Auto";   // カラースキーム名

        this.OP_W = 24; // スケール1のときの1サイクルの幅
        this.OP_H = 24; // スケール1のときの1命令の高さ

        // 拡大率レベル
        this.MAX_ZOOM_LEVEL_ = 24;
        this.zoomLevel_ = 0;       
        this.zoomScale_ = 1;       // 拡大率 (zoomLevel に同期)
        this.laneNum_ = 1;
        this.laneW_ = this.OP_W * this.zoomScale_;
        this.laneH_ = this.OP_H * this.zoomScale_;
        this.opW_ = this.laneW_ * this.laneNum_; 
        this.opH_ = this.laneH_ * this.laneNum_; 

        this.LANE_HEIGHT_MARGIN = 0;
        this.lane_height_margin_ = this.LANE_HEIGHT_MARGIN; // スケール1のときの高さ方向のマージン（命令の間隔）[px]

        // レーンごとの表示オプション
        this.splitLanes_ = false;    // レーンを分割して表示するかどうか
        this.fixOpHeight_ = false;   // レーンを分割して表示する際に高さを一定にするかどうか

        // フラッシュされた命令を隠すオプション
        this.hideFlushedOps_ = false;

        // 線の描画がぼけるので，補正する
        // ref: http://stackoverflow.com/questions/18019453/svg-rectangle-blurred-in-all-browsers
        this.PIXEL_ADJUST = 0.5;    

        // 拡大率が大きい場合，一部描画をはしょる
        this.drawingInterval_ = 1;

        // フォント
        this.labelFont_ = "";
        this.stageFont_ = "";
        this.labelFontSize_ = 12;
        this.stageFontSize_ = 12;

        this.searchRegexp = null;

        // Styles of Konata renderer defined by JSON
        /** @type {Object} */
        this.style_ = null;

        this.startCycle = null;
    }

    addDiffRenderer (renderer) {
      this.diffRenderer = renderer
    }

    setSearchRegexp (regexp) {
      this.searchRegexp = regexp;
      this.change()
    }

    listenChange () {
      if (this.changed) {
        !this.shadow && this.drawLabel(this.labelCanvas)
        this.drawPipeline(this.pipelineCanvas)
        if (this.diffRenderer && this.startCycle && this.diffRenderer.startCycle) {
          this.diffRenderer.zoomScale_ = this.zoomScale_
          this.diffRenderer.moveLogicalPos([this.viewPos[0] + this.diffRenderer.startCycle - this.startCycle, this.viewPos[1]])
          this.diffRenderer.change()
        }
        this.changed = false;
      }
      requestAnimationFrame(() => this.listenChange())
    }

    updateCanvasSize(canvas) {
      let width = canvas.clientWidth;
      let height = canvas.clientHeight;
      let context = canvas.getContext("2d");
      let devicePixelRatio = window.devicePixelRatio || 1;
      let backingStoreRatio = context.backingStorePixelRatio || 1;
      
      if (devicePixelRatio !== backingStoreRatio) {
          let ratio = devicePixelRatio / backingStoreRatio;
          canvas.width = width * ratio;
          canvas.height = height * ratio;
          context.scale(ratio, ratio);
      }
      else{
          canvas.width = width;
          canvas.height = height;
          context.scale(1, 1);
      }
    }

    change() {
      this.changed = true;
    }

    resize () {
      this.updateCanvasSize(this.labelCanvas)
      this.updateCanvasSize(this.pipelineCanvas)
      this.change()
    }

    get opW(){ return this.opW_; }
    get opH(){ return this.opH_; }

    /**
     * viewPos_ の getter
     */
    get viewPos(){
        return [this.viewPos_.left, this.viewPos_.top];
    }

    // getOp で使用する解像度
    get opResolution(){
        // 縦方向が 24 ピクセルなので，2^5 = 32 から解像度を落としても大丈夫
        return this.zoomLevel_ - 5;
    }

    /**
     * 初期化
     * @param {Konata} konata - Konata オブジェクトへの参照
     * @param {Config} config - Config オブジェクトへの参照
     */
    init(konata, config){

        this.konata_ = konata;
        this.config = config;
        this.loadStyle();

        this.viewPos_ = {left:NaN, top:0};
        this.zoomLevel_ = 0;
        this.zoomScale_ = this.calcScale_(this.zoomLevel_);

        this.depArrowType = config.depArrowType;

        this.changeColorScheme(config.colorScheme);
        this.updateScaleParameter();

        this.listenChange();
    }

    reset () {
      this.viewPos_ = {left: NaN, top: 0}
    }

    /**
     * パイプラインのスタイル定義 JSON の読み込み
     */
    loadStyle(){
        let fileName = this.config.THEME_STYLE_LIST[this.config.theme];

        // fs 等で読み込むと，パッケージ後などで起動時のカレントディレクトリが
        // 変わった場合に読み込めなくなるので，require で読む
        this.style_ = {
          "fontSize": "12",
          "fontFamily": "SFMono-Regular, Consolas, 'Liberation Mono', Menlo, Courier, monospace",
          "fontStyle": "normal",
          "fontColor": "#222222",
      
          "labelPane": {
              "marginLeft": "5",
              "backgroundColor": "#303340",
              "fontColor": "#c7c8ca",
              "searchedFontColor": "#F637EC",
              "highlightFontColor": "#ECA6A6",
          },
          "pipelinePane": {
              "backgroundColor": "#262930",
              "backgroundColorStripeOverlay": "#ffffff08",
      
              "fontColor": "#f0f0f0",
              "stallFontColor": "orangered",
              "borderColor": "#f0f0f0",
              "borderWeight": "0.5",
      
              "stageBackgroundColor": {
                  "hRateBegin": "55",
                  "sBegin": "40", 
                  "lBegin": "40",
      
                  "hRateEnd": "55",
                  "sEnd": "40",
                  "lEnd": "40"
              },
              "stallBackgroundColor": "hsl(0,0%,50%)",
              "invalidBackgroundColor": "rgb(30,30,30)",
      
              "arrowColor": "rgb(255,200,0)",
              "arrowWeight": "1",
      
              "flushedRegionColor": "rgba(0,0,0,0.5)"
          }
      };

        let colorStyle = this.style_.pipelinePane.stageBackgroundColor;
        for (let i of ["lBegin", "sBegin", "lEnd", "sEnd"]) {
            colorStyle[i] = Number(colorStyle[i]);
        }
    }

    /**
     * 
     * @param {string} laneName 
     * @param {string} stageName 
     * @param {boolean} isBegin 
     * @param {Op} op 
     */
    getStageColor_(laneName, stageName, isBegin, op){
        let self = this;

        if (self.colorScheme_ == "Auto" || self.colorScheme_ == "Unique") {
            if (stageName == "f" || stageName == "stl") {
                return this.style_.pipelinePane.stallBackgroundColor;
            }
            let stageLevel = self.konata_.stageLevelMap.get(laneName, stageName);
            let laneID = self.konata_.stageLevelMap.getLaneID(laneName);

            let level = self.colorScheme_ == "Auto" ? stageLevel.appearance : stageLevel.unique;
            let color = this.style_.pipelinePane.stageBackgroundColor;
            if (isBegin) {
                let h = ((250 - level*color.hRateBegin + laneID*28*8)%360);
                return `hsl(${h},${color.sBegin}%,${color.lBegin}%)`;
            }
            else{
                let h = ((250 - level*color.hRateEnd + laneID*28*8)%360);
                return `hsl(${h},${color.sEnd}%,${color.lEnd}%)`;
            }
        }
        else if (self.colorScheme_ == "ThreadID") {
            let stageLevel = self.konata_.stageLevelMap.get(laneName, stageName);
            let level = op.tid;
            let color = this.style_.pipelinePane.stageBackgroundColor;
            if (isBegin) {
                let h = ((250 - level*color.hRateBegin)%360);
                let s = color.sBegin;// - stageLevel.appearance*10;
                // A gradation direction is changed depending on the light/dark mode.
                // if color.lBegin > 50, it is assumed the light mode
                let l = (1000 + color.lBegin + (color.lBegin > 50 ? -1 : 1) * stageLevel.appearance*4) % 100;
                return `hsl(${h},${s}%,${l}%)`;
            }
            else{
                let h = ((250 - level*color.hRateEnd)%360);
                let s = color.sEnd;// - stageLevel.appearance*10;
                let l = (1000 + color.lEnd + (color.lEnd > 50 ? -1 : 1) * stageLevel.appearance*4) % 100;
                return `hsl(${h},${s}%,${l}%)`;
            }
        }
        else if (self.colorScheme_ in self.config.customColorSchemes) {
            let style = self.config.customColorSchemes[self.colorScheme_];
            let colorDef = style["defaultColor"];
            if (laneName in style) {
                if (stageName in style[laneName]) {
                    colorDef = style[laneName][stageName];
                }
            }
            let baseColor = this.style_.pipelinePane.stageBackgroundColor;
            let h = colorDef.h;
            let s = colorDef.s;
            let l = colorDef.l;
            if (isBegin) {
                l = (l == "auto") ? baseColor.lBegin : l;
                s = (s == "auto") ? baseColor.sBegin : s;
            }
            else{
                l = (l == "auto") ? baseColor.lEnd : l;
                s = (s == "auto") ? baseColor.sEnd : s;
            }
            if (typeof(s) == "number" || (typeof(s) == "string" && s.match(/^\d+$/))) { s += "%"; }
            if (typeof(l) == "number" || (typeof(l) == "string" && l.match(/^\d+$/))) { l += "%"; }
            return `hsl(${h},${s},${l})`;
        }
        return self.colorScheme_;
    }

    /**
     * カラースキームの変更
     * @param {string} scheme - カラースキーム名
     */
    changeColorScheme(scheme){
        let self = this;
        self.colorScheme_ = scheme;
    }

    /**
     * 依存関係の矢印のタイプを変更
    */
    get depArrowType(){
        return this.depArrowType_;
    }
    set depArrowType(type){
        this.depArrowType_ = type;
    }

    /**
     * マウスホイールによる一単位の移動
     * どれだけ移動するかはその時の scale に依存
     * @param {boolean} wheelUp - ホイールの方向
     */
    moveWheel(wheelUp){
        let self = this;
        let scroll = 3 / self.zoomScale_;
        self.moveLogicalDiff([0, wheelUp ? scroll : -scroll], true);
    }

    /**
     * ピクセル数により表示位置を移動する
     * @param {Array} diff - 移動量
     */
    movePixelDiff(diff){
        let self = this;
        // 論理座標での相対値に変換してから渡す
        self.moveLogicalDiff([
            diff[0] / self.opW_,
            diff[1] / self.opH_,
        ], false);
        this.change()
    }

    /**
     * 縦スクロール時の横方向の補正値を計算
     * @param {number} diffY - 移動量
     */
    adjustScrollDiffX(diffY){
        let self = this;
        let posY = self.viewPos_.top;
        let y = Math.floor(posY);
        if (y < 0 || y > self.getVisibleBottom()){
            return 0;
        }

        // 画面に表示されているものの中で最も上にあるものを基準に
        let oldOp = null;
        oldOp = self.getVisibleOp(y, this.opResolution);

        // 水平方向の補正を行う
        let newTop = y + diffY;
        let newY = Math.floor(newTop);
        let newOp = self.getVisibleOp(newY, this.opResolution);

        if (!newOp) {
            return 0;
        }
        else if (!oldOp || newOp.id == oldOp.id) {
            let left = self.viewPos_.left;
            return newOp.fetchedCycle - left;
        }
        else{
            // スクロール前と後の，左上の命令の水平方向の差を加算
            return newOp.fetchedCycle - oldOp.fetchedCycle;
        }
    }

    /**
     * 論理座標の相対値により表示位置を移動する
     * @param {Array} diff - 移動量
     * @param {boolean} adjust - 命令が画面上左上にくるよう調整するかどうか
     */
    moveLogicalDiff(diff, adjust){
        let self = this;
        let posY = self.viewPos_.top + diff[1];

        let y = Math.floor(posY);
        let op = null;
        op = self.getVisibleOp(y, this.opResolution);

        let oldTop = self.viewPos_.top;
        self.viewPos_.top = posY;

        if (adjust && op) {
            // 水平方向の補正を行う
            let oldOp = self.getVisibleOp(Math.floor(oldTop), this.opResolution);
            if (!oldOp) {
                self.viewPos_.left = op.fetchedCycle;
            }
            else{
                // スクロール前と後の，左上の命令の水平方向の差を加算
                self.viewPos_.left += op.fetchedCycle - oldOp.fetchedCycle;
            }
        } 
        else {
            self.viewPos_.left += diff[0];
            //if (self.viewPos_.left < 0) {
            //    self.viewPos_.left = 0;
            //}
        }
    }

    /**
     * 論理座標の絶対値により表示位置を移動する
     * @param {Array} pos - 位置
     */
    moveLogicalPos(pos){
        let self = this;
        //self.viewPos_.left = Math.max(0, pos[0]);
        //self.viewPos_.top = Math.max(0, pos[1]);
        self.viewPos_.left = pos[0];
        self.viewPos_.top = pos[1];
        this.change()
    }

    // 返回逻辑Y坐标对应的当前显示模式的op
    /** @return {Op} */
    getVisibleOp(y, resolution=0){
        return this.hideFlushedOps_ ? this.getOpFromRID(y, resolution) : this.getOpFromID(y, resolution);
    }
    getVisibleBottom(){
        return this.hideFlushedOps_ ? this.konata_.lastRID : this.konata_.lastID;
    }

    getPosY_FromRID(rid){
        if (this.hideFlushedOps_) {
            return rid;   
        }
        else{
            let op = this.getOpFromRID(rid);
            if (op) {
                return op.id;
            }
            else{
                return -1;
            }
        }
    }

    /**
     * @return {Number} 
     * @param {Op} baseOP
     * */
    getPosY_FromOp(baseOP){
        if (this.hideFlushedOps_) {
            for (let i = baseOP.id; i >= 0; i--) {
                let op = this.getOpFromID(i);   
                if (!op.flush) {
                    return op.rid;
                }
            }
            return 0;
        }
        else{
            return baseOP.id;
        }
    }

    // id に対応する op を返す
    getOpFromID(id, resolution=0){
        let self = this;
        return self.konata_.getOp(id, resolution);   
    }

    // rid に対応する op を返す
    getOpFromRID(rid, resolution=0){
        let self = this;
        return self.konata_.getOpFromRID(rid, resolution);   
    }

    // ピクセル座標から対応する op を返す
    /** @returns {Op} */
    getOpFromPixelPosY(y, resolution=0){
        let self = this;
        let logY = Math.floor(self.viewPos_.top + y / self.opH_);
        return self.getVisibleOp(logY, resolution);   
    }

    getPixelPosYFromOp(op){
        let self = this;
        return ((this.hideFlushedOps_ ? op.rid : op.id) - self.viewPos_.top) * self.opH_;
    }

    getCycleFromPixelPosX(x){
        let self = this;
        return Math.floor(self.viewPos_.left + x / self.opW_);
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    // ピクセル座標に対応するツールチップのテキストを作る
    getLabelToolTipText(y){
        let self = this;
        let op = self.getOpFromPixelPosY(y, this.opResolution);
        if (!op) {
            return null;
        }
        let text = 
            `${this.escapeHtml(op.labelName)}<br>` + 
            `${op.labelDetail}<br>` + 
            `Line: \t\t${op.line}<br>` +
            `Serial ID:\t${op.gid}<br>` +
            `Thread ID:\t\t${op.tid}<br>` +
            `Retire ID:\t\t${op.rid}`;
        if( op.flush ) {
            text += "<br># This op is flushed.";
        }
        return text;
    }

    startSlop(x, y) {
      let op = this.getOpFromPixelPosY(y, this.opResolution);
      if (!op) {
          this.startPoint = null
          this.endPoint = null
      } else {
        this.startPoint = [x, y]
        this.startPos = [this.hideFlushedOps ? op.rid : op.id, this.getCycleFromPixelPosX(x)]
      }
    }

    stopSlop() {
      this.startPoint = null
      this.endPoint = null
      this.change()
    }

    // 为像素坐标创建工具提示文本
    getPipelineToolTipText(x, y){
        let self = this;

        // Y 座標に対応した op を取得
        let op = self.getOpFromPixelPosY(y, this.opResolution);
        if (!op) {
            return null;
        }

        // X 座標に対応したサイクル数を取得
        let cycle = self.getCycleFromPixelPosX(x);
        let text = ""
        if (this.startPoint) {
          const diffY = (this.hideFlushedOps ? op.rid : op.id) - this.startPos[0] + 1;
          const diffX = cycle - this.startPos[1] + 1;
          text += `IPC: ${(diffY / diffX).toFixed(2)} (${diffY} insns / ${diffX} cycle)<br>`
          this.endPoint = [x, y]
          this.change()
        }
        text += `cycle: ${cycle}<br>id: ${op.id}<br>gid: ${op.gid}<br>rid: ${op.rid}<br>${this.escapeHtml(op.labelName)}`;
        if (cycle < op.fetchedCycle || cycle > op.retiredCycle) {
            return text;
        }

        // ステージ名と，ステージに関連づけられたラベルを追加
        let stageText = "";
        let first = true;
        for (let laneName in op.lanes) {
            for (let stage of op.lanes[laneName].stages) {
                let start = stage.startCycle;
                let end = stage.endCycle;
                let length = end - start;
                if (length == 0) {
                    end += 1;   // 長さ0の場合，領域を広げて表示対象に
                }

                if (start <= cycle && cycle < end){
                    // ステージ名と範囲
                    // end は長さ0の時に +1 されてるので，元の値を使う
                    text += `<br>stage: ${stage.fullName} (${stage.endCycle - stage.startCycle} cycle)`;

                    // console.log(cycle, op.tags)
                    if (op.tags[cycle]) {
                      text += `<br><span style="color: ${self.style_.pipelinePane.stallFontColor}">stall: ${op.tags[cycle]}</span>`
                    }
                    // ステージに関連づけられたラベル
                    if (stage.labels != "") {
                        for (let line of stage.labels.split("\n")) {
                            if (line != ""){
                                stageText += `<br>${stage.name}: ${line}`;
                            }
                        }
                    }
                    first = false;
                }
            }
        }

        if (stageText != ""){
            text += "\n" + stageText;
        }

        
        return text;
    }

    // 拡大率の計算
    // level は指数で表す
    calcScale_(level){
        let self = this;
        return Math.pow(2, -level * self.ZOOM_RATIO_);
    }

    // 拡大率が変更された際の，関連パラメータの更新
    updateScaleParameter(){
        let self = this;
        
        // 非同期読み込みをしているので，レーンの数が変わりうる
        self.laneNum_ = Object.keys(self.konata_.laneMap).length;

        let zoomScale = self.zoomScale_;
        let laneNum = self.laneNum_;
        let splitLanes = self.splitLanes_;
        let fixOpHeight = self.fixOpHeight_;

        // レーン/op ごとの大きさ
        self.laneW_ = self.OP_W * zoomScale;
        self.opW_ = self.laneW_;

        if (!splitLanes) {
            laneNum = 1;
        }
        if (fixOpHeight){
            self.laneH_ = self.OP_H * zoomScale / laneNum;
            self.opH_ = self.laneH_ * laneNum;
        }
        else{
            self.laneH_ = self.OP_H * zoomScale;
            self.opH_ = self.laneH_ * laneNum;
        }
        self.lane_height_margin_ = self.canDrawFrame ? self.LANE_HEIGHT_MARGIN * zoomScale : 0;
        //self.drawingInterval_ = Math.floor(20/(zoomScale * Math.log(zoomScale)/0.005));
        self.drawingInterval_ = Math.floor(1 / self.OP_H / zoomScale / 2);

        // フォント
        let fontFamily = self.style_["fontFamily"];
        let fontStyle = self.style_["fontStyle"];
        let fontSize = parseInt(self.style_["fontSize"]);
        self.labelFont_ = `${fontStyle} ${fontSize*zoomScale}px ${fontFamily}`;
        self.searchedLabelFont_ =  `bold ${fontSize*zoomScale}px ${fontFamily}`;
        self.stageFont_ = `${fontStyle} ${fontSize*zoomScale}px ${fontFamily}`;
        // console.log(self.labelFont_, self.stageFont_)
        self.labelFontSize_ = fontSize * zoomScale;
        self.stageFontSize_ = fontSize * zoomScale;
    }

    // レーンを分割して表示するかどうか
    get splitLanes(){
        return this.splitLanes_;
    }
    set splitLanes(s){
        this.splitLanes_ = s;
        this.updateScaleParameter();
    }

    // レーンを分割して表示する際に高さを一定にするかどうか
    get fixOpHeight(){
        return this.fixOpHeight_;
    }   
    set fixOpHeight(f){
        this.fixOpHeight_ = f;
        this.updateScaleParameter();
    }

    // フラッシュされた命令を隠すかどうか
    get hideFlushedOps(){
        return this.hideFlushedOps_;
    }
    set hideFlushedOps(h){
        this.hideFlushedOps_ = h;
        if (this.diffRenderer) {
          this.diffRenderer.hideFlushedOps_ = h;
        }
        this.updateScaleParameter();
        this.change();
    }


    // パイプラインの中まで詳細に表示するかどうか
    // 拡大率によって決定
    get canDrawDetailedly(){
        let laneHeight = this.laneH_ - this.lane_height_margin_ * 2;
        return laneHeight > this.config.drawDetailedlyThreshold;     // 閾値以上の高さがあるかどうか
    }
    get canDrawDependency(){
        let laneHeight = this.laneH_ - this.lane_height_margin_ * 2;
        return laneHeight > this.config.drawDependencyThreshold;
    }
    get canDrawFrame(){
        let laneHeight = this.laneH_ - this.lane_height_margin_ * 2;
        return laneHeight > this.config.drawFrameThreshold;
    }
    get canDrawText(){
        let laneHeight = this.laneH_ - this.lane_height_margin_ * 2;
        return laneHeight > this.config.drawTextThreshold;
    }

    get zoomLevel(){
        return this.zoomLevel_;
    }    

    get zoomScale(){
        return this.zoomScale_;
    }    

    /**
     * @param {number} zoomLevel - zoom level
     * @param {number} posX - ズームの中心点
     * @param {number} posY - ズームの中心点
     * @param {boolean} compensatePos - 中心点の位置補正を行うかどうか
     */
    zoomAbs(zoomLevel, posX, posY, compensatePos=true){
        let self = this;
        self.zoomLevel_ = zoomLevel;

        // 最大最小ズーム率に補正
        self.zoomLevel_ = Math.max(Math.min(self.zoomLevel_, self.MAX_ZOOM_LEVEL_), -1);

        let oldScale = self.zoomScale_;
        self.zoomScale_ = self.calcScale_(self.zoomLevel_);
        self.updateScaleParameter();

        // 位置の補正
        //let oldLeft = self.viewPos_.left;
        //let oldTop = self.viewPos_.top;
        if (compensatePos) {
            let ratio = oldScale / self.zoomScale_;
            self.moveLogicalPos([
                self.viewPos_.left - (posX - posX / ratio) / self.opW_,
                self.viewPos_.top - (posY - posY / ratio) / self.opH_
            ]);
        }
        this.change()
        //console.log(`zoom ratio:${ratio}  [${oldLeft}, ${oldTop}] to [${self.viewPos_.left}, ${self.viewPos_.top}]`);
    }

    /**
     * @param {number} zoomLevelDiff - zoom level の差分
     * @param {number} posX - ズームの中心点
     * @param {number} posY - ズームの中心点
     */
    zoom(zoomLevelDiff, posX, posY){
        let self = this;
        self.zoomAbs(self.zoomLevel + zoomLevelDiff, posX, posY);
    }

    // canvas にラベルを描画
    drawLabel(canvas){
        let self = this;
        let pos = self.viewPos_;
        let top = pos.top;

        self.updateScaleParameter();    // 非同期読み込みの関係で，毎回呼ぶ必要がある
        self.drawLabelTile_(canvas, top);
        return true;
    }

    /** ラベルを実際に描画
     * @param {Object} tile - 描画対象の canvas
     * @param {number} logTop - 現在論理位置
     */
    drawLabelTile_(tile, logTop){
        let self = this;

        // 背景をクリア
        let ctx = tile.getContext("2d");
        ctx.fillStyle = self.style_.labelPane.backgroundColor;//"rgb(245,245,245)";
        ctx.fillRect(0, 0, tile.width, tile.height);

        // 小さくなりすぎたらスキップ
        if (!self.canDrawText) {
            return;
        }

        // フォントを設定
        let fontSizeRaw = self.labelFontSize_;
        

        // スケールを勘案した論理サイズに変換
        let logHeight = tile.height / self.opH_;
        //let logWidth = tile.width / (scale * self.opW_);
        
        let marginLeft = self.style_.labelPane.marginLeft;
        let marginTop = (self.laneH_ - self.lane_height_margin_*2 - fontSizeRaw) / 2 + fontSizeRaw;

        try {
            for (let logY = Math.floor(logTop); logY < logTop + logHeight; logY++) {
                let x = marginLeft;
                let y = (logY - logTop) * self.opH_ + marginTop;
                let op = self.getVisibleOp(logY);
                if (op) {
                    if (logY % 2 == 0) {
                      let fillTop = (logY - logTop) * self.opH_;
                      ctx.fillStyle = this.style_.pipelinePane.backgroundColorStripeOverlay;
                      ctx.fillRect(0, fillTop, tile.clientWidth, this.opH_);
                    }
                    if (op.searched) {
                      ctx.fillStyle = self.style_.labelPane.searchedFontColor;
                    } else if (this.searchRegexp && this.searchRegexp.exec(op.labelName)) {
                      ctx.fillStyle = self.style_.labelPane.highlightFontColor;
                    } else {
                      ctx.fillStyle = self.style_.labelPane.fontColor;
                    }
                    ctx.font = self.labelFont_;
                    let text = `${logY}: s${op.gid} (t${op.tid}: r${op.rid}): ${op.labelName}`;
                    ctx.fillText(text, x, y);
                }
            }
        } catch(e) {
            console.log(e);
            return;
        }
    }

    // canvas にパイプラインを描画
    drawPipeline(canvas){
        let self = this;
        let pos = self.viewPos_;
        let top = pos.top;
        let left = pos.left;

        self.updateScaleParameter();    // 非同期読み込みの関係で，毎回呼ぶ必要がある
        let ctx = canvas.getContext("2d");
        ctx.save()
        self.drawPipelineTile_(canvas, top, left);
        ctx.restore()
        ctx.font = "32px"
        ctx.fillStyle = "white"
        ctx.fillText(self.zoomScale_, canvas.width / 2, 20);
        return true;
    }

    // private methods
    drawPipelineTile_(tile, top, left){
        let self = this;
        let scale = self.zoomScale_;
        let height = tile.height / self.opH_;
        let width = tile.width / self.opW_;

        let ctx = tile.getContext("2d");
        if (!this.shadow) {
          ctx.fillStyle = self.style_.pipelinePane.backgroundColor; //"rgb(255,255,255)";
          ctx.fillRect(0, 0, tile.width, tile.height);
        }

        // 上側にはみ出ていた場合，暗く描画
        let offsetY = 0;
        if (top < 0 && !this.shadow) {
            let bottom = -top * self.opH_ + self.PIXEL_ADJUST;
            bottom = Math.min(tile.height, bottom);
            ctx.fillStyle = this.style_.pipelinePane.invalidBackgroundColor;
            ctx.fillRect(0, 0, tile.width, bottom);
            if (bottom >= tile.height) {
                return;
            }
            offsetY = -top;
            top = 0;
        }

        // タイルの描画
        let skipRendering = false;
        for (let y = Math.floor(top); 
            y < top + height; 
            y += (this.opH_ < 0.25) ? self.drawingInterval_ : 1
        ) {

            // 背景をストライプに
            let pixelY = y - top + offsetY;
            if (self.canDrawFrame && !this.shadow) {
                if (y % 2 == 0) {
                    let fillTop = pixelY * this.opH_ + self.PIXEL_ADJUST;
                    ctx.fillStyle = this.style_.pipelinePane.backgroundColorStripeOverlay;
                    ctx.fillRect(0, fillTop, tile.clientWidth, this.opH_);
                }
            }
            if (skipRendering) {
                continue;
            }

            let op = null;
            try {
              op = self.getVisibleOp(y, this.opResolution);
              // console.log("line", y, op)
            } catch(e) {
                console.log(e);
                return;
            }
            if (op == null) {
                // Since id can not be contiguous in gem5, there can be valid ops 
                // after null.
                continue;   
            }

            if (!self.drawOp_(op, y - top + offsetY, left, left + width, scale, ctx)) {
                skipRendering = true;
            }
        }

        // 依存関係
        if (self.depArrowType_ != DEP_ARROW_TYPE.NOT_SHOW) {
            self.drawDependency(offsetY, top, left, width, height, ctx);
        }


        // 下側にはみ出ていた場合，暗く描画
        if (top - offsetY + height > self.getVisibleBottom() && !this.shadow) {
          // console.log(self.getVisibleBottom())
            let begin = tile.height - (top - offsetY + height - (self.getVisibleBottom() + 1)) * self.opH_ + self.PIXEL_ADJUST;
            begin = Math.max(0, begin);
            ctx.fillStyle = this.style_.pipelinePane.invalidBackgroundColor;
            ctx.fillRect(0, begin, tile.width, tile.height);
        }

        if (this.startPoint && this.endPoint && !this.shadow) {
          ctx.beginPath()
          ctx.moveTo(this.startPoint[0], this.startPoint[1])
          ctx.lineTo(this.endPoint[0], this.endPoint[1])
          ctx.strokeStyle = "red"
          ctx.stroke()
        }
    }

    drawDependency(logOffsetY, logTop, logLeft, logWidth, logHeight, ctx){
        // 依存関係の描画
        let self = this;

        if (!self.canDrawDependency) {
            return;
        }
        let arrowBeginOffsetX = self.opW_ * 3 / 4 + self.PIXEL_ADJUST;
        let arrowEndOffsetX = self.opW_ * 1 / 4 + self.PIXEL_ADJUST;
        let arrowMidOffsetY = self.laneH_ / 2 + self.PIXEL_ADJUST;
        let arrowBeginOffsetY = self.laneH_ * 2 / 3 + self.PIXEL_ADJUST;
        let arrowEndOffsetY = self.laneH_ * 1 / 3 + self.PIXEL_ADJUST;

        let arrowWeight = this.style_.pipelinePane.arrowWeight;
        ctx.lineWidth = arrowWeight;
        ctx.strokeStyle = this.style_.pipelinePane.arrowColor;
        ctx.fillStyle = this.style_.pipelinePane.arrowColor;

        //for (let y = Math.floor(logTop - logHeight); y < logTop + logHeight; y++) {
        for (let y = Math.floor(logTop); y < logTop + logHeight; y++) {
            let op = self.getVisibleOp(y);
            if (!op) {
                continue;
            }

            let consCycle = op.consCycle;
            if (consCycle == -1) {
                continue;
            }

            for (let dep of op.prods) {

                let prod = this.getOpFromID(dep.opID);    // ここは getVisibleOp ではない
                if (!prod) {
                    continue;
                }
                if (this.hideFlushedOps_ && prod.flush) {
                    continue;   // フラッシュされた命令は表示しない
                }
                let prodCycle = prod.prodCycle;
                if (prodCycle == -1) {
                    continue;
                }

                // フラッシュされた命令を表示するかどうかで位置を変える
                let yProd = this.hideFlushedOps_ ? prod.rid : prod.id;  

                if (self.depArrowType_ == DEP_ARROW_TYPE.INSIDE_LINE) {
                    let xBegin = (prodCycle - logLeft) * self.opW_ + arrowBeginOffsetX;
                    let yBegin = (yProd - logTop + logOffsetY) * self.opH_ + arrowMidOffsetY;
                    let xEnd = (consCycle - logLeft) * self.opW_ + arrowEndOffsetX;
                    let yEnd = (y - logTop + logOffsetY) * self.opH_ + arrowMidOffsetY;

                    self.drawArrow_(ctx, [xBegin, yBegin], [xEnd, yEnd], [xEnd - xBegin, yEnd - yBegin], arrowWeight);
                }
                else {
                    let xBegin = (prod.fetchedCycle - logLeft) * self.opW_;
                    let yBegin = (yProd - logTop + logOffsetY) * self.opH_ + arrowBeginOffsetY;
                    let xEnd = (op.fetchedCycle - logLeft) * self.opW_;
                    let yEnd = (y - logTop + logOffsetY) * self.opH_ + arrowEndOffsetY;

                    self.drawArrow_(ctx, [xBegin, yBegin], [xEnd, yEnd], [1, 0], arrowWeight);
                }
            }

            /*
            let prodCycle = op.prodCycle;
            if (prodCycle == -1) {
                continue;
            }
            for (let dep of op.cons) {

                let cons = self.getOpFromID(dep.id);    // ここは getVisibleOp ではない
                if (!cons) {
                    continue;
                }
                if (this.hideFlushedOps_ && cons.flush) {
                    continue;   // フラッシュされた命令は表示しない
                }
                let consCycle = cons.consCycle;
                if (consCycle == -1) {
                    continue;
                }

                // フラッシュされた命令を表示するかどうかで位置を変える
                let yCons = this.hideFlushedOps_ ? cons.rid : cons.id;  

                if (self.depArrowType_ == DEP_ARROW_TYPE.INSIDE_LINE) {
                    let xBegin = (prodCycle - logLeft) * self.opW_ + arrowBeginOffsetX;
                    let yBegin = (y - logTop + logOffsetY) * self.opH_ + arrowOffsetY;
                    let xEnd = (consCycle - logLeft) * self.opW_ + arrowEndOffsetX;
                    let yEnd = (yCons - logTop + logOffsetY) * self.opH_ + arrowOffsetY;

                    self.drawArrow_(ctx, [xBegin, yBegin], [xEnd, yEnd], [xEnd - xBegin, yEnd - yBegin]);
                }
                else {
                    let xBegin = (op.fetchedCycle - logLeft) * self.opW_;
                    let yBegin = (y - logTop + logOffsetY) * self.opH_ + arrowOffsetY;
                    let xEnd = (cons.fetchedCycle - logLeft) * self.opW_;
                    let yEnd = (yCons - logTop + logOffsetY) * self.opH_ + arrowOffsetY;

                    self.drawArrow_(ctx, [xBegin, yBegin], [xEnd, yEnd], [1, 0]);
                }
            }
            */
        }
    }

    
    /** 矢印を描画する
    * @param {Object} ctx - 2D context
    * @param {array} start - やじりの先端
    * @param {array} end - やじりの終端
    * @param {array} v - 向きと高さを指定するベクトル
    * @param {number} size - サイズの倍率
    */
    drawArrow_(ctx, start, end, v, size){
        let self = this;
        if (self.depArrowType_ == DEP_ARROW_TYPE.INSIDE_LINE) {
            // パイプライン中の X ステージ
            ctx.beginPath();
            ctx.moveTo(start[0], start[1]);
            ctx.lineTo(end[0], end[1]);
            ctx.stroke();
        }
        else {
            // 左側の曲線
            let offsetX = start[0] - self.opW_ * Math.sqrt((end[1] - start[1]) / self.opH_);
            ctx.beginPath();
            ctx.moveTo(start[0], start[1]);
            ctx.bezierCurveTo(
                offsetX, start[1], 
                offsetX, end[1], 
                end[0], end[1]
            );
            ctx.stroke();
        }

        // 矢印の頭
        let shape = 0.8;
        let pts = [];
        let norm = Math.sqrt(v[0] * v[0] + v[1] * v[1]);
        let f = size * 5 / norm;   // 5: サイズ
        v[0] *= f;
        v[1] *= f;

        pts[0] = end;
        pts[1] = [end[0] - v[0] - v[1] * 0.5 * shape, end[1] - v[1] + v[0] * 0.5 * shape];
        pts[2] = [end[0] - v[0] + v[1] * 0.5 * shape, end[1] - v[1] - v[0] * 0.5 * shape];
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        ctx.lineTo(pts[1][0], pts[1][1]);
        ctx.lineTo(pts[2][0], pts[2][1]);
        ctx.fill();
    }

    /**
     * @param {Op} op 
     * @param {number} h 
     * @param {number} startCycle 
     * @param {number} endCycle 
     * @param {number} scale 
     * @param {*} ctx 
     */
    drawOp_(op, h, startCycle, endCycle, scale, ctx){
        let self = this;
        let top = h * self.opH_ + self.PIXEL_ADJUST;
        
        if (op.retiredCycle < startCycle) {
            return true;
        } else if (endCycle < op.fetchedCycle) {
            return false;
        }
        if (op.retiredCycle == op.fetchedCycle) {
            return true;
        }
        let l = startCycle > op.fetchedCycle ? (startCycle - 1) : op.fetchedCycle; l -= startCycle;
        let r = endCycle >= op.retiredCycle ? op.retiredCycle : (endCycle + 1); r -= startCycle;
        let left = l * self.opW_ + self.PIXEL_ADJUST;
        let right = r * self.opW_ + self.PIXEL_ADJUST;

        let stageLevelMap = this.konata_.stageLevelMap;
        let laneNum = stageLevelMap.laneNum;

        if (self.canDrawDetailedly && !this.shadow) {
            // 枠内に表示の余地がある場合
            ctx.strokeStyle = this.style_.pipelinePane.borderColor;

            for (let laneName in op.lanes) {
                let laneTop = 
                self.splitLanes_ ? 
                    (h + stageLevelMap.getLaneID(laneName) / laneNum) : h;  // logical pos
                self.drawLane_(op, laneTop, startCycle, endCycle, scale, ctx, laneName);
            }
            /*
            let keys = [];
            for (let key in op.lanes) {
                keys.push(key);
            }
            keys = keys.sort();
            for (let i = 0, len = keys.length; i < len; i++) {
                let key = keys[i];
                let laneTop = self.splitLanes_ ? (h + i / laneNum) : h;  // logical pos
                self.drawLane_(op, laneTop, startCycle, endCycle, scale, ctx, key);
            }
            */
        }
        else{
            // 十分小さい場合は簡略化モード
            if (self.colorScheme_ != "Auto" && 
                self.colorScheme_ != "Unique" && 
                self.colorScheme_ != "ThreadID" && 
            !(self.colorScheme_ in self.config.customColorSchemes)
            ) {
                ctx.fillStyle = self.colorScheme_;
            }
            else{
              if (!this.shadow) {
                ctx.fillStyle = "#888888";
              } else {
                if (self.canDrawDetailedly) {
                  ctx.fillStyle = "rgba(255,0,0,0.2)";
                } else {
                  ctx.fillStyle = "red";
                }
              }
            }

            // 表示位置の計算
            let laneHeight = self.laneH_ - self.lane_height_margin_ * 2;
            let laneTop = top + self.lane_height_margin_;

            // 縮小率が高すぎると表示が小さくなりすぎて何も見えなくなるので，
            // 最低1ピクセルは表示するように補正
            if (right - left < 1) {
                right = left + 1;
            }
            if (laneHeight < 0.5) {
                laneHeight = 0.5;
            }

            ctx.fillRect(left, laneTop, right - left, laneHeight);

            if (op.flush) {
                let bgc = this.style_.pipelinePane.flushedRegionColor;    // 黒の半透明をかぶせる
                ctx.fillStyle = bgc;
                ctx.fillRect(left, laneTop, right - left, laneHeight);
            }

        }
        return true;
    }

    drawLane_(op, h, startCycle, endCycle, scale, ctx, laneName){
        let self = this;

        let fontSizeRaw = self.stageFontSize_;
        ctx.font = self.stageFont_;

        let lane = op.lanes[laneName].stages;
        let top = h * self.opH_ + self.PIXEL_ADJUST;
        for (let i = 0, len = lane.length; i < len; i++) {
            let stage = lane[i];
            if (stage.endCycle == 0) {
                stage.endCycle = op.retiredCycle;
            }
            if (stage.endCycle < startCycle) {
                continue;
            } 
            else if (endCycle < stage.startCycle) {
                break; // stage.startCycle が endCycleを超えているなら，以降のステージはこのcanvasに描画されない．
            }
            if (stage.endCycle == stage.startCycle) {
                continue;
            }
            
            let logLeft = Math.max(startCycle - 1, stage.startCycle) - startCycle;
            let logRight = Math.min(endCycle + 1, stage.endCycle) - startCycle; 

            let left = logLeft * self.opW_ + self.PIXEL_ADJUST;
            let right = logRight * self.opW_ + self.PIXEL_ADJUST;
            let rect = [
                left, 
                top + self.lane_height_margin_, 
                right - left, 
                (self.laneH_ - self.lane_height_margin_ * 2)
            ];

            let grad = ctx.createLinearGradient(0, top, 0, top + self.laneH_);
            grad.addColorStop(0, self.getStageColor_(laneName, stage.name, true, op));
            grad.addColorStop(1, self.getStageColor_(laneName, stage.name, false, op));
            //grad.addColorStop(0, color);

            ctx.fillStyle = grad;
            ctx.fillRect(rect[0], rect[1], rect[2], rect[3]);

            if (self.canDrawFrame){
                ctx.lineWidth = this.style_.pipelinePane.borderWeight;
                ctx.strokeRect(rect[0], rect[1], rect[2], rect[3]);
            }

            if (self.canDrawText) {
                let textTop = top + (self.laneH_ - self.lane_height_margin_*2 - fontSizeRaw) / 2 + fontSizeRaw - 1;
                // console.log(self.laneH_, fontSizeRaw)
                let textLeft = (stage.startCycle - startCycle) * self.opW_;

                let margin = Math.max(0, (self.opW_ - stage.name.length*fontSizeRaw/2)/2);
                // 画stage名称
                if (op.tags[stage.startCycle]) {
                  ctx.fillStyle = self.style_.pipelinePane.stallFontColor;
                } else {
                  ctx.fillStyle = self.style_.pipelinePane.fontColor;
                }
                ctx.fillText(stage.name, textLeft + margin, textTop);

                // 画cycle
                for (let j = 1, len_in = stage.endCycle - stage.startCycle; j < len_in; j++) {
                    let margin = Math.max(0, (self.opW_ - String(j).length*fontSizeRaw/2)/2);
                    if (op.tags[stage.startCycle + j]) {
                      ctx.fillStyle = self.style_.pipelinePane.stallFontColor;
                    } else {
                      ctx.fillStyle = self.style_.pipelinePane.fontColor;
                    }
                    ctx.fillText(j + 1, textLeft + margin + j * self.opW_, textTop);
                }
                
            }

            if (op.flush) {
                let bgc = this.style_.pipelinePane.flushedRegionColor; //self.getStyleRule_([".flush"], "background-color", 1, "#888");
                ctx.fillStyle = bgc;
                ctx.fillRect(rect[0], rect[1], rect[2], rect[3]);
            }

        }
    }
}

// この書式じゃないと IntelliSense が効かない
export {
  KonataRenderer,
  DEP_ARROW_TYPE
}
