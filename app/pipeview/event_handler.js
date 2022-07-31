let ZOOM_ANIMATION_PERIOD = 80;
class Zoom {
  constructor(renderer) {
    this.zoom = {}
    this.renderer = renderer
  }
  startZoom(zoomLevelDiff, offsetX, offsetY, speed=1.0, compensatePos=true) {
    let self = this;
    if (self.zoom.inAnimation) {
      self.finishZoom();
    }
    // 拡大 or 縮小
    self.zoom.direction = zoomLevelDiff > 0;
    self.zoom.diff = zoomLevelDiff;
    self.zoom.curLevel = this.renderer.zoomLevel;
    self.zoom.endLevel = 
        self.zoom.curLevel + zoomLevelDiff;
    self.zoom.speed = speed;
    self.zoom.basePoint = [offsetX, offsetY];
    self.zoom.inAnimation = true;
    self.zoom.timerID = requestAnimationFrame(() => self.animateZoom());
    self.zoom.compensatePos = compensatePos;
  }
  animateZoom() {
    let self = this;
    if (!self.zoom.inAnimation) {
      return;
    }

    let frames = ZOOM_ANIMATION_PERIOD / 16 / self.zoom.speed;
    self.zoom.curLevel += self.zoom.diff / frames;
    
    self.zoomAbs(
        self.zoom.curLevel, 
        self.zoom.basePoint[0], 
        self.zoom.basePoint[1],
        self.zoom.compensatePos
    );

    if ((self.zoom.direction && self.zoom.curLevel >= self.zoom.endLevel) ||
        (!self.zoom.direction && self.zoom.curLevel <= self.zoom.endLevel)
    ){
        self.finishZoom();
        return;
    }
    self.zoom.timerID = requestAnimationFrame(() => self.animateZoom());
  }
  zoomAbs(zoomLevel, posX, posY, compensatePos){
    this.renderer.zoomAbs(zoomLevel, posX, posY, compensatePos);
  }
  finishZoom(){
    let self = this;
    self.zoom.inAnimation = false;
    cancelAnimationFrame(self.zoom.timerID);
    this.renderer.zoomAbs(
      self.zoom.endLevel, 
      self.zoom.basePoint[0], 
      self.zoom.basePoint[1],
      self.zoom.compensatePos)
  }
}

let SCROLL_ANIMATION_PERIOD = 100;
class Scroll {
  constructor (renderer) {
    this.renderer = renderer
    this.scrollEndPos =  [0, 0]
    this.curScrollPos =  [0, 0]
  }
  startScroll (delta, adjust) {
    let self = this;
    if (self.inScrollAnimation) {
      self.finishScroll();
    }
    let renderer = this.renderer;
    let scale = renderer.zoomScale;
    let diffY = delta * 3 / scale;
    let diffX = adjust ? renderer.adjustScrollDiffX(diffY) : 0;
    self.startScroll0([diffX, diffY]);
  }
  startScroll0 (scrollDiff, speed=1.0) {
    let self = this;
    self.scrollAnimationDiff = scrollDiff;
    self.scrollAnimationDirection = [scrollDiff[0] > 0, scrollDiff[1] > 0];
    self.curScrollPos = this.renderer.viewPos;
    self.scrollEndPos = [
      self.curScrollPos[0] + scrollDiff[0],
      self.curScrollPos[1] + scrollDiff[1]
    ]
    self.inScrollAnimation = true;
    self.scrollAnimationID = requestAnimationFrame(() => self.animateScroll());
    self.scrollSpeed = speed;
  }
  animateScroll(){
    let self = this;
    if (!self.inScrollAnimation) {
        return;
    }

    let diff = self.scrollAnimationDiff;
    let dir = self.scrollAnimationDirection;
    let frames = SCROLL_ANIMATION_PERIOD / 16 / self.scrollSpeed;

    self.curScrollPos[0] += diff[0] / frames;
    self.curScrollPos[1] += diff[1] / frames;
    // console.log(self.curScrollPos)
    this.renderer.moveLogicalPos(self.curScrollPos);

    if (((dir[0] && self.curScrollPos[0] >= self.scrollEndPos[0]) ||
        (!dir[0] && self.curScrollPos[0] <= self.scrollEndPos[0])) &&
        ((dir[1] && self.curScrollPos[1] >= self.scrollEndPos[1]) ||
        (!dir[1] && self.curScrollPos[1] <= self.scrollEndPos[1]))
    ){
        self.finishScroll()
        return;
    }
    self.scrollAnimationID = requestAnimationFrame(() => self.animateScroll());
  }
  finishScroll(){
    let self = this
    self.inScrollAnimation = false;
    cancelAnimationFrame(self.scrollAnimationID);
    
    self.renderer.moveLogicalPos(self.scrollEndPos);
  }
}

class Drag {
  constructor (renderer) {
    this.renderer = renderer
  }
  startDrap (x, y) {
    this.inDrag = true
    this.prevMousePoint = [x, y]
  }
  endDrap () {
    this.inDrag = false
  }
  drag (x, y) {
    if (!this.inDrag) {
      return false;
    }
    let diff = [
      this.prevMousePoint[0] - x,
      this.prevMousePoint[1] - y
    ];
    this.prevMousePoint = [x, y];
    this.renderer.movePixelDiff(diff)
    return true;
  }
}

class SplitterDrag {
  constructor (labelCantainer, renderer) {
    this.labelCantainer = labelCantainer;
    this.renderer = renderer;
    this.hideLabelPanel = false;
  }
  startDrap (x) {
    this.inDrag = true;
    this.prevMouseX = x;
  }
  endDrag () {
    this.inDrag = false;
  }
  drag (x) {
    if (!this.inDrag) {
      return;
    }
    let diff = x - this.prevMouseX;
    this.prevMouseX = x;
    this.labelCantainer.style.width = `${this.labelCantainer.offsetWidth + diff}px`;
    this.renderer.resize()
  }
  hide () {
    this.labelCantainer.style.display = "none"
    this.hideLabelPanel = true;
    this.renderer.resize()
  }
  show () {
    this.labelCantainer.style.display = "block"
    this.hideLabelPanel = false;
    this.renderer.resize()
  }
}

class ToolTip {
  constructor() {
    this.mouseOffset = [0,0]
  }
  move (e) {
    this.mouseIn = true;
    this.mouseOffset = [e.offsetX, e.offsetY]
    this.updateToolTip(e)
  }
  leave() {
    if (!this.mouseIn) {
      return;
    }
    this.mouseIn = false;
    this.updateToolTip()
  }
  updateToolTip (e) {
  }
}
class ToolTipPipeline extends ToolTip {
  constructor (toolTip, renderer) {
    super()
    this.toolTip = toolTip;
    this.renderer = renderer;
  }
  updateToolTip (e) {
    if (this.mouseIn) {
      const text = this.renderer.getPipelineToolTipText(this.mouseOffset[0], this.mouseOffset[1])
      if (text) {
        this.toolTip.style.left = e.clientX + "px";
        this.toolTip.style.top = (e.clientY + 20) + "px";
        this.toolTip.style.visibility = "visible"
        this.toolTip.innerHTML = text;
        return;
      }
    }
    this.toolTip.style.visibility = "hidden"
  }
}
class ToolTipLabel extends ToolTip {
  constructor (toolTip, renderer) {
    super()
    this.toolTip = toolTip;
    this.renderer = renderer;
  }
  updateToolTip (e) {
    if (this.mouseIn) {
      const text = this.renderer.getLabelToolTipText(this.mouseOffset[1])
      if (text) {
        this.toolTip.style.left = e.clientX + "px";
        this.toolTip.style.top = (e.clientY + 20) + "px";
        this.toolTip.style.visibility = "visible"
        this.toolTip.innerHTML = text;
        return;
      }
    }
    this.toolTip.style.visibility = "hidden"
  }
}

class Search {
  constructor (renderer, konata) {
    this.renderer = renderer;
    this.konata = konata;
    this.currentId = -1;
    this.regexp = new RegExp(".");
  }
  setCurrentId (id) {
    this.currentId = id;
  }
  setSearchRegexp (regexp) {
    this.regexp = new RegExp(regexp)
  }
  reset() {
    const currentOp = this.konata.getOp(this.currentId);
    if (currentOp && currentOp.searched) {
      currentOp.searched = false;
      this.renderer.change();
    }
    this.currentId = -1;
  }
  move (op) {
    this.currentId = op.id;
    const moveTo = this.renderer.getPosY_FromOp(op);
    this.renderer.moveLogicalPos([op.fetchedCycle, moveTo])
  }
  find (isPrev) {
    const currentOp = this.konata.getOp(this.currentId);
    if (!currentOp) {
      return false;
    }
    currentOp.searched = false;
    const start = this.currentId;
    const end = isPrev ? 0 : this.konata.lastID;
    for (let i = start; (isPrev && i >= end) || (!isPrev && i <= end); i = i + (isPrev ? -1 : 1)) {
      const op = this.konata.getOp(i);
      // console.log(op && op.labelName)
      if (op && this.regexp.exec(op.labelName)) {
        if (this.renderer.hideFlushedOps && op.flush) {
          continue;
        }
        console.log("matched", op)
        op.searched = true;
        this.currentId = op.id;
        this.move(op);
        return true;
      }
    }
    return false;
  }
  findNext () {
    if (this.currentId < 0) {
      return;
    }
    const currentOp = this.konata.getOp(this.currentId);
    console.log(currentOp)
    if (currentOp) {
      if (currentOp.searched && this.regexp.exec(currentOp.labelName)) {
        this.currentId += 1;
        if (this.find()) {
          currentOp.searched = false;
          this.renderer.change();
        } else {
          this.currentId = currentOp.id;
        }
      } else {
        currentOp.searched = false;
        this.find();
      }
    }
  }
  findPrev () {
    if (this.currentId < 0) {
      return;
    }
    const currentOp = this.konata.getOp(this.currentId);
    console.log(currentOp)
    if (currentOp) {
      if (currentOp.searched && this.regexp.exec(currentOp.labelName)) {
        this.currentId -= 1;
        if (this.find(true)) {
          currentOp.searched = false;
          this.renderer.change();
        } else {
          this.currentId = currentOp.id;
        }
      } else {
        currentOp.searched = false;
        this.find(true);
      }
    }
  }
}

export {
  Drag,
  Scroll,
  Zoom,
  SplitterDrag,
  ToolTipPipeline,
  ToolTipLabel,
  Search
}