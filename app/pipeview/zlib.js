class zlib {
  static gzip (raw_data, cb) {
    cb(null, raw_data);
  }
  static gunzipSync (compressed_data) {
    return compressed_data;
  }
}

export {
  zlib
}