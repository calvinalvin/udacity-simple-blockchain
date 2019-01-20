class Mempool {
  constructor() {
    this.waitingTransactions = {};
    this.timeoutRequests = {};
    this.timeoutRequestWindow = 5 * 60 * 1000;
  }

  addRequestValidation(address) {
    let self = this;
    console.log("this.waitingTransactions --- ", this.waitingTransactions);
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
        "requestTimeStamp": timestamp,
        "walletAddress": address,
        "message": `${address}:${timestamp}:starRegistry`,
        "validationWinow": timeLeft
      };
    } else {
      return null;
    }
  }
}

module.exports = Mempool;
