class Utilities {
  wait(time) {
    return new Promise((r) => setTimeout(r, time).unref());
  }
}
module.exports = { Utilities };
