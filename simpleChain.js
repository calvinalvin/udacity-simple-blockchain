/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/

const SHA256 = require("crypto-js/sha256");
const level = require("level");

/* ===== Block Class ==============================
|  Class with a constructor for block 			   |
|  ===============================================*/

class Block {
  constructor(data) {
    this.hash = "";
    this.height = 0;
    this.body = data;
    this.time = 0;
    this.previousBlockHash = "";
  }
}

/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

class Blockchain {
  constructor() {
    this.initializeChain();
    this.isInitialized = false;
  }

  async initializeChain() {
    this.chainDB = new DB("./chaindata");
    await this.addGenesisBlock();
    this.isInitialized = true;
  }

  async addGenesisBlock() {
    const blockHeight = await this.getBlockHeight();

    if (blockHeight === 0) {
      console.log("Adding genesis block");
      return this.addBlock(
        new Block("First block in the chain - Genesis block")
      );
    } else {
      console.log("Genesis block already exists");
    }
  }

  // Add new block
  async addBlock(newBlock) {
    const currentBlockHeight = await this.getBlockHeight();
    // Block height
    newBlock.height = currentBlockHeight + 1;
    // UTC timestamp
    newBlock.time = new Date()
      .getTime()
      .toString()
      .slice(0, -3);
    // previous block hash
    if (currentBlockHeight > 0) {
      const previousBlock = await this.getBlock(currentBlockHeight);
      newBlock.previousBlockHash = previousBlock.hash;
    }
    // Block hash with SHA256 using newBlock and converting to a string
    newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
    // Adding block object to chain
    return this.chainDB.addDataToLevelDB(JSON.stringify(newBlock));
  }

  // Get block height
  async getBlockHeight() {
    return await this.chainDB.getKeyCount();
  }

  // get block
  async getBlock(blockHeight) {
    // return object as a single string
    let record = await this.chainDB.getLevelDBData(blockHeight);
    return JSON.parse(record);
  }

  // validate block
  async validateBlock(blockHeight) {
    // get block object
    let block = await this.getBlock(blockHeight);
    // get block hash
    let blockHash = block.hash;
    // remove block hash to test block integrity
    block.hash = "";
    // generate block hash
    let validBlockHash = SHA256(JSON.stringify(block)).toString();
    // Compare
    if (blockHash === validBlockHash) {
      return true;
    } else {
      console.log(
        "Block #" +
          blockHeight +
          " invalid hash:\n" +
          blockHash +
          "<>" +
          validBlockHash
      );
      return false;
    }
  }

  // Validate blockchain
  async validateChain() {
    let blockHeight = await this.getBlockHeight();
    let errorLog = [];
    for (var i = 1; i < blockHeight; i++) {
      // validate block
      let isValid = await this.validateBlock(i);
      if (!isValid) {
        errorLog.push(i);
      }
      // skip previous hash check for genesis block
      if (i > 1) {
        // compare blocks hash link
        let blockHash = await this.getBlock(i).hash;
        let previousHash = await this.getBlock(i - 1).previousBlockHash;
        if (blockHash !== previousHash) {
          errorLog.push(i);
        }
      }
    }

    if (errorLog.length > 0) {
      console.log("Block errors = " + errorLog.length);
      console.log("Blocks: " + errorLog);
    } else {
      console.log("No errors detected");
    }
  }
}

/* ===== DB Class =======================================
|  Persistence layer for chain data. Writes to levelDB   |
|  =====================================================*/

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
      let i = 1;
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

module.exports = {
  Block,
  Blockchain
};
