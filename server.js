const express = require("express");
const util = require("util");
const bodyParser = require("body-parser");
const { Blockchain } = require("./lib/simpleChain");
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
  const blockHeight = req.params.blockHeight;

  try {
    const block = await blockchain.getBlock(blockHeight);
    res.json(block);
  } catch (err) {
    next(err);
  }
});

app.post("/block", async (req, res, next) => {
  const data = req.body;

  if (!data) {
    next(new Error("block data is missing"));
  }

  if (data.body === null || data.body === undefined) {
    next(new Error("block data is missing body"));
  }

  try {
    const result = await blockchain.addBlock(data);

    // addBlock returns array with length 2 [key, value]
    // if 2 are not returned something went wrong
    if (result.length != 2) {
      throw new Error("Something went wrong while adding block");
    }

    const newBlock = JSON.parse(result[1]);
    res.send(newBlock);
  } catch (err) {
    next(err);
  }
});

app.post('/requestValidation', async(req, res, next) => {
  const data = req.body;
  console.log('data from request ---- ', data);
  if (!data.address) {
    next(new Error("address is missing from request"));
  }
 
//  try {
    console.log("blockchain.isInitialized ---- ", blockchain);
    console.log("mempool ---- ", mempool);
    console.log("mempool.timeoutRequestWindow-----", mempool.timeoutRequestWindow);
    let result = mempool.addRequestValidation(data.address);
    console.log("requestValidation add ----", result);
    res.json(result);
 // } catch (err) {
   // next(err);
  //}
  
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
