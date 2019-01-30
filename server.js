const express = require("express");
const util = require("util");
const bodyParser = require("body-parser");
const hex2ascii = require('hex2ascii');
const { Block, Blockchain } = require("./lib/simpleChain");
const Mempool = require('./lib/mempool');
const app = express();
const port = 8000;

const blockchain = new Blockchain();
const mempool = new Mempool();

function handler(fn) {
  return async function(req, res, next) {
    try {
      return await fn(req, res, next);
    }
    catch (e) {
      next(e);
    }
  }
}


// parse application/json
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("Server up!");
});

app.get('/block-height', handler(async (req, res, next) => {
  let height =  await blockchain.getChainHeight();
  res.json({ height });
}));

app.get("/block/:blockHeight", handler(async (req, res, next) => {
  const blockHeight = req.params.blockHeight;
  const block = await blockchain.getBlock(blockHeight);
  
  if (block && block.body && block.body.star) {
    block.body.star.storyDecoded = hex2ascii(block.body.star.story);
  }

  res.json(block);
}));

app.post("/block", handler(async (req, res, next) => {
  const data = req.body;

  if (!data) {
    throw new Error("Block data is missing");
  }

  if (!data.address) {
    throw new Error("Address is missing"); 
  }

  if (!data.star) {
    throw new Error("Star data is missing");
  }

  let addressIsVerified = mempool.verifyAddressRequest(data.address);
  if (!addressIsVerified) {
    throw new Error("Address has not been verified so star will not be added. You miust go through the validation process first.");
  }

  let blockData = {
    address: data.address,
    star: {
      ra: data.star.ra,
      dec: data.star.dec,
      story: Buffer.from(data.star.story).toString('hex')
    }
  }

  let block = new Block(blockData);

  const result = await blockchain.addBlock(block);

  // addBlock returns array with length 2 [key, value]
  // if 2 are not returned something went wrong
  if (result.length != 2) {
    throw new Error("Something went wrong while adding block");
  }

  const newBlock = JSON.parse(result[1]);
  res.json(newBlock);
}));

app.post('/requestValidation', handler(async(req, res, next) => {
  const data = req.body;

  if (!data.address) {
    next(new Error("address is missing from request"));
  }

  let result = mempool.addRequestValidation(data.address);
  res.json(result);
}));

app.post('/message-signature/validate', handler(async(req, res, next) => {
  const data = req.body;

  if (!data.address) {
    next(new Error('address is missing from request'));
  }

  if (!data.signature) {
    next(new Error('signature is missing from request'));
  }

  let validation = mempool.validateRequestByWallet(data.address, data.signature);   res.json(validation);
}));


app.get('/stars/hash::hash', handler(async(req, res, next) => { 
  let block = await blockchain.getBlockByHash(req.params.hash);
  if (block) {
    res.json(block);
  }
  else {
    res.status(404).json({ message: "Not Found" });
  }
}));

app.get('/stars/address::address', handler(async(req, res, next) => {
  let blocks = await blockchain.getBlocksForWalletAddress(req.params.address);
  res.json(blocks);
}));

app.use(async (err, req, res, next) => {
  res.status(422).json({
    code: err.code,
    error: err.message
  });
});

app.listen(port, () => {
  util.log(`App listening on port ${port}!`);
});
