const express = require("express");
const util = require("util");
const bodyParser = require("body-parser");
const { Block, Blockchain } = require("./lib/simpleChain");
const Mempool = require('./lib/mempool');
const app = express();
const port = 8000;

const blockchain = new Blockchain();
const mempool = new Mempool();


// parse application/json
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("Server up!");
});

app.get("/block/:blockHeight", async (req, res, next) => {
  try {
    const blockHeight = req.params.blockHeight;
    const block = await blockchain.getBlock(blockHeight);
    res.json(block);
  } catch (e) {
    next(e);
  }
 });

app.post("/block", async (req, res, next) => {
  //try {
    const data = req.body;

    console.log("data is -0----- ", data);

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
        story: Buffer(data.star.story).toString('hex')
      }
    }

    let block = new Block(blockData);
    const result = await blockchain.addBlock(data);

    // addBlock returns array with length 2 [key, value]
    // if 2 are not returned something went wrong
    if (result.length != 2) {
      throw new Error("Something went wrong while adding block");
    }

    const newBlock = JSON.parse(result[1]);
    res.json(newBlock);
  //} catch (e) {
    next(e);
  //}

});

app.post('/requestValidation', async(req, res, next) => {
  try {
    const data = req.body;
  
    if (!data.address) {
      next(new Error("address is missing from request"));
    }
 
    let result = mempool.addRequestValidation(data.address);
    res.json(result);
  } catch (e) {
    next(e);
  }

});

app.post('/message-signature/validate', async(req, res, next) => {
  try {
    const data = req.body;

    if (!data.address) {
      next(new Error('address is missing from request'));
    }

    if (!data.signature) {
      next(new Error('signature is missing from request'));
    }

    let validation = mempool.validateRequestByWallet(data.address, data.signature);   res.json(validation);
  } catch (e) {
    next(e);
  }
});

app.use(async (err, req, res, next) => {
  res.status(422).json({
    code: err.code,
    error: err.message
  });
});

app.listen(port, () => {
  util.log(`App listening on port ${port}!`);
});
