# dSynthLottery (Synthetix Lottery)
A participating solution in the Open DeFi Hackathon https://gitcoin.co/issue/snxgrants/open-defi-hackathon/8/100025689

## Development
### Blockchain part - Smart Contracts

#### Setup for local blockchain environment

Make sure to install [Truffle](https://www.trufflesuite.com/docs/truffle/getting-started/installation). 
Then you can run the following commands to deploy the smart contracts and also test them.

```PS
npm install     # install dependencies such as @chainlink/contracts and @openzeppelin/contracts
truffle migrate --network [networkName] # build and deploy the smart contracts on a given network
truffle test    # run the tests
```

If at some point you would like to redeploy the contracts just run the command

```PS
truffle migrate --reset --network [networkName] # build and redeploy the smart contract - [networkname] could be for instance kovan
```

#### Learn More

Check out the [Truffle documentation](https://www.trufflesuite.com/docs/truffle/overview).
