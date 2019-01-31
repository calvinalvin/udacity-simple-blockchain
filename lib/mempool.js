const bitcoinMessage = require('bitcoinjs-message'); 

class Mempool {
  constructor() {
    this.waitingTransactions = {};
    this.validAddresses = {};
    this.timeoutRequests = {};
    this.timeoutRequestWindow = 5 * 60 * 1000;
  }

  addRequestValidation(address) {
    let self = this;
    if (!this.waitingTransactions[address]) {
      let timestamp = new Date().getTime().toString().slice(0,-3);
      this.waitingTransactions[address] = timestamp;
      this.timeoutRequests[address] = setTimeout(function() {
        self.removeValidationRequest(address);
      }, self.timeoutRequestWindow);
    }

    return this.getValidationRequest(address);
  }

  removeValidationRequest(address) {
    this.waitingTransactions[address] = null;
    this.timeoutRequests[address] = null;
  }

  getValidationRequest(address) {
    if (this.waitingTransactions[address]) {
      let timestamp = this.waitingTransactions[address];
      let timeElapse = (new Date().getTime().toString().slice(0,-3)) - timestamp;
      let timeLeft = (this.timeoutRequestWindow/1000) - timeElapse;
      
      return {
        "requestTimestamp": timestamp,
        "walletAddress": address,
        "message": `${address}:${timestamp}:starRegistry`,
        "validationWindow": timeLeft
      };
    } else {
      return null;
    }
  }

  validateRequestByWallet(address, signature) {
    let waitingTransaction = this.getValidationRequest(address);

    if (!waitingTransaction) {
      throw new Error("There are no waiting transactions for that address");
    }

    let isValid = bitcoinMessage.verify(waitingTransaction.message, address, signature);
    if (!isValid) {
      throw new Error('Signature is invalid');
    }

    let validation = {
      registerStar: true,
      status: {
        address: waitingTransaction.walletAddress,
        requestTimestamp: waitingTransaction.requestTimestamp,
        message: waitingTransaction.message,
        messageSignature: isValid,
        validationWindow: waitingTransaction.validationWindow
      }
    };

    this.validAddresses[address] = validation;
    this.removeValidationRequest(address);
    return validation;
  }

  // adds address to validAddresses array
  // any addresses in this array have gone through
  // the requestValidation/verifySig flow and are
  // allowed to post stars
  registerValidAddress(address, validationData) {
    if (!this,validAddresses[address]) {
      this.validAddresses[address] = validationData;
    }
  }

  // removes validAddress from the validAddresses array
  // once a star is posted into the block, the address
  // should be deregistered so they cannot post another
  // star into the block without going through the 
  // validation flow again
  deregisterValidAddress(address) {
    this.validAddresses[address] = null;
  }

  // verifies if an address has gone through validation process
  verifyAddressRequest(address) {
    if (this.validAddresses[address]) {
      return true;
    } else {
      return false;
    }
  }


}

module.exports = Mempool;
