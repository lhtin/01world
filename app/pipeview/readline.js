class ReadlineInterface {
  constructor ({filePath, file}) {
    this.lineCB = null;
    this.closeCB = null;
    this.file = file
    this.reader = file.stream().getReader()
    this.filePath = filePath
    this.totalSize = file.size
    this.readSize = 0;
    this.remainStr = ""
  }
  close () {
  }

  reading() {
    this.reader.read().then(({done, value}) => {
      if (done) {
        console.log("load file done.")
        this.closeCB()
        return
      }
      this.readSize += value.length
      const appendStr = new TextDecoder().decode(value)
      const str = this.remainStr + appendStr
      let lines = str.split("\n")
      if (lines[lines.length - 1]) {
        this.remainStr = lines[lines.length - 1]
        lines = lines.slice(0, -1)
      } else {
        this.remainStr = ""
      }
      for (let line of lines) {
        if (line) {
          // console.log(line)
          this.lineCB(line)
        }
      }

      setTimeout(() => {
        this.reading()
      }, 100)
    })
  }
  on (event, cb) {
    if (event === "line") {
      this.lineCB = cb;
      this.reading()
    } else if (event === "close") {
      this.closeCB = cb;
    }
  }
  getPercent () {
    return this.readSize / this.totalSize;
  }
}

const readline = {
  createInterface: (config) => {
    return new ReadlineInterface(config);
  }
}

export {
  readline
}