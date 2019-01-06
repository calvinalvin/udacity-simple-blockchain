const { Block, Blockchain } = require("./lib/simpleChain");
const myBlockChain = new Blockchain();

(function theLoop(i) {
  setTimeout(function() {
    let blockTest = new Block("Test Block - " + (i + 1));
    myBlockChain.addBlock(blockTest).then(result => {
      console.log(`Added: `, result);
      i++;
      if (i < 10) {
        theLoop(i);
      } else {
        console.log("Running chain validation ......");
        myBlockChain.validateChain();
      }
    });
  }, 1000);
})(0);
