import { Config } from './config.js';
import { Konata } from "./konata.js"
import { KonataRenderer } from "./konata_renderer.js";
import { Zoom, Scroll, Drag, SplitterDrag, ToolTipLabel, ToolTipPipeline, Search } from './event_handler.js';

const doms = {
  pipelineCanvas: document.getElementById('pipeline-canvas'),
  labelCanvas: document.getElementById('lable-canvas'),
  splitter: document.getElementById('splitter'),
  progressBar: document.getElementById('progress-bar'),
  toolTip: document.getElementById('tool-tip'),
  userGuide: document.getElementById('user-guide'),
  searchBox: document.getElementById('search-box'),
  searchClose: document.getElementById('search-close'),
  searchInput: document.getElementById('search-input'),
  searchUp: document.getElementById('search-up'),
  searchDown: document.getElementById('search-down'),
}

class App {
  constructor() {
    this.renderer = new KonataRenderer(doms.labelCanvas, doms.pipelineCanvas);
    this.config = new Config();
    this.konata = new Konata()
    this.zoom = new Zoom(this.renderer)
    this.scroll = new Scroll(this.renderer)
    this.drag = new Drag(this.renderer)
    this.renderer.init(this.konata, this.config)
    this.toolTipPipeline = new ToolTipPipeline(doms.toolTip, this.renderer)
    this.toolTipLabel = new ToolTipLabel(doms.toolTip, this.renderer)
    this.splitterDrag = new SplitterDrag(document.getElementById('label-canvas-container'), this.renderer)
    this.search = new Search(this.renderer, this.konata)
  }
  loadFile (file) {
    doms.progressBar.value = 0;
    this.renderer.reset()
    this.konata.openFile(file,
      (percent, count) => {
        console.log("base", percent, count);
        if (Number.isNaN(this.renderer.viewPos[0])) {
          this.renderer.moveLogicalPos([this.konata.startCycle, this.renderer.viewPos[1]])
          this.renderer.startCycle = this.konata.startCycle
        }
        this.renderer.change()
        doms.progressBar.value = percent;
      }, () => {
        console.log("finish")
        doms.progressBar.value = 1;
        this.renderer.change()
      }, (errMsg) => {
        console.warn(errMsg);
      })
  }
  loadDiffFile (file) {
    this.diffRenderer = new KonataRenderer(doms.labelCanvas, doms.pipelineCanvas, true);
    this.diffKonata = new Konata()
    this.diffRenderer.init(this.diffKonata, this.config)
    this.renderer.addDiffRenderer(this.diffRenderer)
    this.diffRenderer.reset()
    this.diffKonata.openFile(file,
      (percent, count) => {
        console.log("diff", percent, count);
        if (Number.isNaN(this.diffRenderer.viewPos[0])) {
          this.diffRenderer.moveLogicalPos([this.diffKonata.startCycle, this.diffRenderer.viewPos[1]])
          this.diffRenderer.startCycle = this.diffKonata.startCycle
        }
      }, () => {
        console.log("finish")
      }, (errMsg) => {
        console.warn(errMsg);
      })
  }
}

let currentApp = new App();


const initSearch = () => {
  doms.searchInput.addEventListener('input', (e) => {
    const regexp = new RegExp(e.target.value)
    currentApp.search.setSearchRegexp(regexp)
  })
  doms.searchInput.addEventListener('keydown', (e) => {
    if (e.key == "Enter") {
      console.log(e.target.value)
      const regexp = new RegExp(e.target.value)
      currentApp.renderer.setSearchRegexp(regexp)
      currentApp.search.findNext()
    }
  });
  doms.searchClose.addEventListener('click', () => {
    doms.searchBox.style.display = 'none';
    currentApp.search.reset();
  })
  doms.searchUp.addEventListener('click', () => {
    currentApp.search.findPrev()
  })
  doms.searchDown.addEventListener('click', () => {
    currentApp.search.findNext()
  })
}

const initKey = () => {
  const onFileOpen = async () => {
    const [fileHandle] = await window.showOpenFilePicker();
    const file = await fileHandle.getFile();
    currentApp.loadFile({
      size: file.size,
      name: 'unknown',
      reader: file.stream().getReader(),
    })
  }
  const onDiffFileOpen = async () => {
    const [fileHandle] = await window.showOpenFilePicker();
    const file = await fileHandle.getFile();
    currentApp.loadDiffFile({
      size: file.size,
      name: 'unknown',
      reader: file.stream().getReader(),
    })
  }
  document.getElementById('open-file').addEventListener('click', onFileOpen)
  window.addEventListener('keydown', (e) => {
    // console.log(e)
    if (e.ctrlKey && e.code == "KeyO") {
      if (e.shiftKey) {
        onDiffFileOpen()
      } else {
        onFileOpen();
      }
      e.preventDefault()
    } else if (e.ctrlKey && e.code == "Equal") {
      currentApp.zoom.startZoom(-1, 0, 0)
      e.preventDefault()
    } else if (e.ctrlKey && e.code == "Minus") {
      currentApp.zoom.startZoom(1, 0, 0)
      e.preventDefault()
    } else if (e.ctrlKey && e.code == "KeyA") {
      currentApp.renderer.hideFlushedOps = !currentApp.renderer.hideFlushedOps;
      e.preventDefault()
    } else if (e.ctrlKey && e.code == "KeyG") {
      doms.userGuide.style.display = doms.userGuide.style.display == "flex" ? "none" : "flex";
      e.preventDefault()
    } else if (e.ctrlKey && e.code == "KeyF") {
      doms.searchBox.style.display = doms.searchBox.style.display == "flex" ? "none" : "flex";
      if (doms.searchBox.style.display == "flex") {
        doms.searchInput.focus();
        currentApp.search.reset()
        const op = currentApp.renderer.getVisibleOp(Math.floor(currentApp.renderer.viewPos[1]))
        if (op) {
          currentApp.search.setCurrentId(op.id);
        }
      } else {
        currentApp.renderer.setSearchRegexp(null);
      }
      e.preventDefault()
    } else if (e.ctrlKey && e.code == "KeyZ") {
      if (currentApp.splitterDrag.hideLabelPanel) {
        currentApp.splitterDrag.show()
      } else {
        currentApp.splitterDrag.hide()
        currentApp.renderer.moveLogicalPos([currentApp.konata.startCycle, 0])
      }
    }
  })
}

const initBox = () => {
  const onMouseWheel = (e) => {
    if (e.ctrlKey) {
      currentApp.zoom.startZoom(e.deltaY > 0 ? 1 : -1, e.offsetX, e.offsetY)
    } else {
      currentApp.scroll.startScroll(e.deltaY > 0 ? 1 : -1, true)
    }
    e.preventDefault()
  }
  
  const onMouseDown = (e) => {
    if (e.buttons & 1) {
      currentApp.drag.startDrap(e.clientX, e.clientY)
      e.preventDefault()
    }
  }
  const onMouseUp = (e) => {
    if (!(e.buttons & 1)) {
      currentApp.drag.endDrap()
      e.preventDefault()
    }
  }
  const onMouseMove = (e) => {
    if (currentApp.drag.drag(e.clientX, e.clientY)) {
      e.preventDefault()
    }
  }
  const onResize = (e) => {
    currentApp.renderer.resize()
    e.preventDefault()
  }

  window.addEventListener('resize', onResize);
  window.addEventListener('DOMContentLoaded', onResize);
  doms.pipelineCanvas.addEventListener('mousedown', onMouseDown)
  window.addEventListener('mouseup', onMouseUp)
  window.addEventListener('mousemove', onMouseMove)
  doms.pipelineCanvas.addEventListener("mousewheel", onMouseWheel)
  doms.labelCanvas.addEventListener("mousewheel", onMouseWheel)
  let fired = false
  let starSlope = false;
  window.addEventListener("keydown", (e) => {
    if (e.code == "AltLeft" && !fired) {
      fired = true
      e.preventDefault()
    }
  })
  window.addEventListener("keyup", (e) => {
    if (e.code == "AltLeft") {
      currentApp.renderer.stopSlop();
      fired = false
      starSlope = false
    }
  })
  doms.pipelineCanvas.addEventListener("mousemove", (e) => {
    if (fired && !starSlope) {
      starSlope = true
      currentApp.renderer.startSlop(e.offsetX, e.offsetY);
    }
    currentApp.toolTipPipeline.move(e)
  })
  doms.pipelineCanvas.addEventListener("mouseleave", (e) => {
    currentApp.toolTipPipeline.leave()
  })

  doms.labelCanvas.addEventListener("mousedown", (e) => {
    let op = currentApp.renderer.getOpFromPixelPosY(e.offsetY);
    if (op) {
      currentApp.renderer.moveLogicalPos([op.fetchedCycle, currentApp.renderer.viewPos[1]]);
    }
  })
  doms.labelCanvas.addEventListener("mousemove", (e) => {
    currentApp.toolTipLabel.move(e)
  })
  doms.labelCanvas.addEventListener("mouseleave", (e) => {
    currentApp.toolTipLabel.leave()
  })

  doms.splitter.addEventListener('mousedown', (e) => {
    currentApp.splitterDrag.startDrap(e.clientX)
    e.stopPropagation()
  })
  document.addEventListener('mousemove', (e) => {
    currentApp.splitterDrag.drag(e.clientX)
  })
  document.addEventListener('mouseup', (e) => {
    currentApp.splitterDrag.endDrag()
  })
}

initKey()
initBox()
initSearch()

const loadDemo1 = async () => {
  const demo = sessionStorage.getItem("fileName") || 'demo.pipeview.txt-disasm.log'
  fetch(`./${demo}`)
    .then((res) => {
      const size = Number(res.headers.get("content-length"));
      const reader = res.body.getReader();
      currentApp.loadFile({
        size: size,
        name: demo,
        reader: reader,
      })
    })
}

const loadDemo2 = async () => {
  const demo = sessionStorage.getItem("fileName") || 'demo.pipeview.txt-disasm.log'
  const demo1 = "statemate-default.pipeview.txt-disasm.log"
  const demo2 = "statemate-scheduling.pipeview.txt-disasm.log"
  fetch(`./${demo2}`)
    .then((res) => {
      const size = Number(res.headers.get("content-length"));
      const reader = res.body.getReader();
      currentApp.loadFile({
        size: size,
        name: demo,
        reader: reader,
      })
      fetch(`./${demo1}`).then((res) => {
        const size = Number(res.headers.get("content-length"));
        const reader = res.body.getReader();
        currentApp.loadDiffFile({
          size: size,
          name: demo,
          reader: reader,
        })
      })
    })
}

loadDemo1()
