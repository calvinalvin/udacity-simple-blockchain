/* ===== DB Class =======================================
|  Persistence layer for chain data. Writes to levelDB   |
|  =====================================================*/
const level = require("level");

class DB {
  constructor(dbPath) {
    this.db = level(dbPath);
  }

  // Add data to levelDB with key/value pair
  async addLevelDBData(key, value) {
    return new Promise((resolve, reject) => {
      this.db.put(key, value, err => {
        if (err) {
          reject(err);
        }

        return resolve([key, value]);
      });
    });
  }

  // Get data from levelDB with key
  async getLevelDBData(key) {
    return new Promise((resolve, reject) => {
      this.db.get(key, (err, value) => {
        if (err) {
          reject(err);
        }

        resolve(value);
      });
    });
  }

  async getKeyCount() {
    return new Promise((resolve, reject) => {
      let i = 0;
      this.db
        .createReadStream()
        .on("data", function(data) {
          i++;
        })
        .on("error", function(err) {
          reject(err);
        })
        .on("close", function() {
          resolve(i);
        });
    });
  }

  // Add data to levelDB with value
  async addDataToLevelDB(value) {
    const self = this;
    return new Promise((resolve, reject) => {
      let i = 0;
      this.db
        .createReadStream()
        .on("data", function(data) {
          i++;
        })
        .on("error", function(err) {
          reject(err);
        })
        .on("close", function() {
          resolve(self.addLevelDBData(i, value));
        });
    });
  }
}

module.exports = DB;
