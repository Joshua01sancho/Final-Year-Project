module.exports = async function(callback) {
  try {
    // Get current block timestamp
    const block = await web3.eth.getBlock('latest');
    const currentTime = block.timestamp;
    console.log("\nCurrent blockchain time:", new Date(currentTime * 1000).toLocaleString());

    // Advance time by 60 seconds
    await web3.currentProvider.send({
      jsonrpc: '2.0',
      method: 'evm_increaseTime',
      params: [60],
      id: new Date().getTime()
    });

    // Mine a new block
    await web3.currentProvider.send({
      jsonrpc: '2.0',
      method: 'evm_mine',
      params: [],
      id: new Date().getTime()
    });

    // Get new block timestamp
    const newBlock = await web3.eth.getBlock('latest');
    console.log("New blockchain time:", new Date(newBlock.timestamp * 1000).toLocaleString());

    callback();
  } catch (error) {
    console.error("Error:", error);
    callback(error);
  }
}; 