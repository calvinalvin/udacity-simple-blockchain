const SHA256 = require('crypto-js/sha256');
const util = require('util');
const DB = require('./db');

/* ===== Block Class ==============================
|  Class with a constructor for block 			   |
|  ===============================================*/

class Block {
  constructor(data) {
    this.hash = '';
    this.height = 0;
    this.body = data;
    this.time = 0;
    this.previousBlockHash = '';
  }
}

/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

class Blockchain {
  constructor() {
    // mempool stores transactions before they are validated and accepted
    this.initializeChain();
    this.isInitialized = false;
  }

  async initializeChain() {
    util.log('Initializing blockchain');
    this.chainDB = new DB('./chaindata');
    await this.addGenesisBlock();
    this.isInitialized = true;
  }

  async addGenesisBlock() {
    const blockHeight = await this.getChainHeight();
    util.log('blockHeight is ', blockHeight);

    if (blockHeight === -1) {
      util.log('Adding genesis block');
      const genesisBlock = new Block(
        'First block in the chain - Genesis block',
      );
      genesisBlock.hash = SHA256(JSON.stringify(genesisBlock)).toString();
      await this.chainDB.addDataToLevelDB(JSON.stringify(genesisBlock));
    } else {
      util.log('Genesis block already exists');
    }
  }

  // Add new block
  async addBlock(newBlock) {
    const currentBlockHeight = await this.getChainHeight();
    // Block height
    newBlock.height = currentBlockHeight + 1;
    // UTC timestamp
    newBlock.time = new Date()
      .getTime()
      .toString()
      .slice(0, -3);

    // previous block hash
    const previousBlock = await this.getBlock(currentBlockHeight);
    newBlock.previousBlockHash = previousBlock.hash;

    // Block hash with SHA256 using newBlock and converting to a string
    newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
    // Adding block object to chain
    return this.chainDB.addDataToLevelDB(JSON.stringify(newBlock));
  }

  // Get block height
  async getChainHeight() {
    return (await this.chainDB.getKeyCount()) - 1;
  }

  // get block
  async getBlock(blockHeight) {
    // return object as a single string
    let record = await this.chainDB.getLevelDBData(blockHeight);
    return JSON.parse(record);
  }

  async getBlockByHash(hash) {
    let chainHeight = await this.getChainHeight();
    let block;

    for (let i = 1; i <= chainHeight; i++) {
      let tmp = await this.getBlock(i);
      if (tmp.hash === hash) {
        block = tmp;
        break;
      }
    }

    return block;
  }

  async getBlocksForWalletAddress(address) {
    let chainHeight = await this.getChainHeight();
    let blocks = [];
    
    for (let i = 1; i < chainHeight; i++) {
      let tmp = await this.getBlock(i);
      if (tmp.body && tmp.body.address && tmp.body.address === address) {
        blocks.push(tmp);
      }
    }

    return blocks;
  }

  // validate block
  async validateBlock(blockHeight) {
    // get block object
    let block = await this.getBlock(blockHeight);
    // get block hash
    let blockHash = block.hash;
    // remove block hash to test block integrity
    block.hash = '';
    // generate block hash
    let validBlockHash = SHA256(JSON.stringify(block)).toString();
    // Compare
    if (blockHash === validBlockHash) {
      return true;
    } else {
      util.log(
        'Block #' +
          blockHeight +
          ' invalid hash:\n' +
          blockHash +
          '<>' +
          validBlockHash,
      );
      return false;
    }
  }

  // Validate blockchain
  async validateChain() {
    let blockHeight = await this.getChainHeight();
    let errorLog = [];
    for (var i = 0; i < blockHeight; i++) {
      // validate block
      let isValid = await this.validateBlock(i);
      if (!isValid) {
        errorLog.push(i);
      }
      // skip previous hash check for genesis block
      if (i !== 0) {
        // compare blocks hash link
        let blockHash = await this.getBlock(i).hash;
        let previousHash = await this.getBlock(i - 1).previousBlockHash;
        if (blockHash !== previousHash) {
          errorLog.push(i);
        }
      }
    }

    if (errorLog.length > 0) {
      util.log('Block errors = ' + errorLog.length);
      util.log('Blocks: ' + errorLog);
    } else {
      util.log('No errors detected');
    }
  }
}

module.exports = {
  Block,
  Blockchain,
};
