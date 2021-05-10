const Lottery = artifacts.require("Lottery");
const SUSDMock = artifacts.require('SUSDMock');
const VRFCoordinatorMock = artifacts.require('VRFCoordinatorMock');
module.exports = async (deployer, network, accounts) => {
  console.log('Deploying lottery from account: ', accounts[0])

  //TODO - add params!!!
  deployer.deploy(Lottery, { from: accounts[0] });
};
