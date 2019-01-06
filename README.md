# Blockchain Data

Blockchain has the potential to change the way that the world approaches data. Develop Blockchain skills by understanding the data model behind Blockchain by developing your own simplified private blockchain.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

Installing Node and NPM is pretty straightforward using the installer package available from the (Node.js® web site)[https://nodejs.org/en/].

### Configuring your project

- Use NPM to initialize your project and create package.json to store project dependencies.

```
npm init
```

- Install crypto-js with --save flag to save dependency to our package.json file

```
npm install crypto-js --save
```

- Install level with --save flag

```
npm install level --save
```

## Testing

To test code:
1: Open a command prompt or shell terminal after install node.js.
2: Enter a node session, also known as REPL (Read-Evaluate-Print-Loop).

```
node
```

3: Copy and paste your code into your node session
4: Instantiate blockchain with blockchain variable

```
let blockchain = new Blockchain();
```

5: Generate 10 blocks using a for loop

```
for (var i = 0; i <= 10; i++) {
  blockchain.addBlock(new Block("test data "+i));
}
```

6: Validate blockchain

```
blockchain.validateChain();
```

7: Induce errors by changing block data

```
let inducedErrorBlocks = [2,4,7];
for (var i = 0; i < inducedErrorBlocks.length; i++) {
  blockchain.chain[inducedErrorBlocks[i]].data='induced chain error';
}
```

8: Validate blockchain. The chain should now fail with blocks 2,4, and 7.

```
blockchain.validateChain();
```

## Web Service API

The blockchain also exposes a web api service to interact with the blockchain.

#### How to run the web service

To run the service, simply run:

```
node server.js
```

This will boot the web service. You can test out the service by pasting `http://localhost:8000` into your browser. You should see the message 'Server up!'.

#### Available endpoints

The web service exposes 2 endpoints. 1 GET endpoint allows you to view block data and 1 POST endpoint allows you to post new blocks into the blockchain.

##### GET /block/:blockHeight

Allows access to blocks with a block height parameter. The response for the endpoint should provide block object.

**URL**

http://localhost:8000/block/[blockheight]

**Example**

http://localhost:8000/block/0, where '0' is the block height.

For URL, http://localhost:8000/block/0

```
HTTP/1.1 200 OK
content-type: application/json; charset=utf-8
cache-control: no-cache
content-length: 179
accept-ranges: bytes
Connection: close
{"hash":"49cce61ec3e6ae664514d5fa5722d86069cf981318fc303750ce66032d0acff3","height":0,"body":"First block in the chain - Genesis block","time":"1530311457","previousBlockHash":""}
```

##### POST /block

You can add new blocks by POST'ing to `/block` with a data payload. The body of the request payload **must** contain a `body` property with a string value.

**URL**

http://localhost:8000/block

**Example**

POST to `http://localhost:8000/block` With the request payload:

```
{
      "body": "Testing block with test string data"
}
```

The response for the endpoint is a block object of the block that was newly created.
