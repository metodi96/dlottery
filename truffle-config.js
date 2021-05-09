const HDWalletProvider = require('@truffle/hdwallet-provider')
const path = require("path");
require('dotenv').config()

module.exports = {
  contracts_build_directory: path.join(__dirname, "frontend/src/contracts"),
  networks: {
    develop: {
      host: "127.0.0.1",
      port: 7545,   
      network_id: "*"   
    },
    rinkeby: {
      provider: () => {
        return new HDWalletProvider(process.env.MNEMONIC, process.env.RINKEBY_RPC_URL)
      },
      network_id: '4',
      skipDryRun: true,
    }
  },
  compilers: {
    solc: {
      version: "0.8.0"
    }
  }
};
