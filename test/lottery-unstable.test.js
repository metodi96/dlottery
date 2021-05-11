/*const { contract, web3, provider } = require('@openzeppelin/test-environment');
const Lottery = contract.fromArtifact('Lottery');
const VRFCoordinatorMock = contract.fromArtifact('VRFCoordinatorMock')
const SUSDMock = contract.fromArtifact('SUSDMock')
const truffleAssert = require('truffle-assertions')
const { LinkToken } = require('@chainlink/contracts/truffle/v0.4/LinkToken')
const { expect } = require('chai');

LinkToken.setProvider(provider);

contract('Lottery', ([ owner, participantOne, participantTwo, participantThree, participantFour, participantFive ]) => {
    let lottery, vrfCoordinatorMock, seed, link, keyhash, fee, sUSD
    before(async () => {
        sUSD = await SUSDMock.new({ from: owner })
        console.log('susd mock address', sUSD.address)
        keyhash = '0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4'
        fee = '1000000000000000000'
        seed = 123
        link = await LinkToken.new({ from: owner })
        vrfCoordinatorMock = await VRFCoordinatorMock.new(link.address, { from: owner })
        lottery = await Lottery.new(sUSD.address, vrfCoordinatorMock.address, link.address, keyhash, { from: owner })
        const balanceOfOwner = await sUSD.balanceOf(owner)
        const balanceOfSC = await sUSD.balanceOf(sUSD.address)
        const totalSupply = await sUSD.totalSupply()
        console.log('Participant 1: ', participantOne)
        console.log('Participant 2: ', participantTwo)
        console.log('Participant 3: ', participantThree)
        console.log('Participant 4: ', participantFour)
        console.log('Participant 5: ', participantFive)
        console.log('balance of owner sUSD ', balanceOfOwner.toString())
        console.log('balance of sc', balanceOfSC.toString())
        console.log('total supply', totalSupply.toString())
    });

    describe('Lottery contract deployment', async () => {
        it('Deploys the Lottery contract successfully.', async () => {
            console.log('Address is ', lottery.address)
            expect(lottery.address).to.not.equal('');
            expect(lottery.address).to.not.equal(0x0);
            expect(lottery.address).to.not.equal(null);
            expect(lottery.address).to.not.equal(undefined);
        })

        it('The lottery SC should have a name and a symbol.', async () => {
            const name = await lottery.name()
            expect(name).to.equal('dSynthLottery');
            const symbol = await lottery.symbol()
            expect(symbol).to.equal('DSL');
        })

        it('The lottery SC should have a right fee, and lotteryIds.', async () => {
            const lotteryId = await lottery.getLotteryId()
            expect(lotteryId.toString()).to.equal('1')
        })
    })

    describe('Buy a ticket', async () => {
        it('Deploys the Lottery contract successfully.', async () => {
            console.log('Address is ', lottery.address)
            expect(lottery.address).to.not.equal('');
            expect(lottery.address).to.not.equal(0x0);
            expect(lottery.address).to.not.equal(null);
            expect(lottery.address).to.not.equal(undefined);
        })

        it('The lottery SC should have a name and a symbol.', async () => {
            const name = await lottery.name()
            expect(name).to.equal('dSynthLottery');
            const symbol = await lottery.symbol()
            expect(symbol).to.equal('DSL');
        })

        it('The lottery SC should have a right fee, and lotteryIds.', async () => {
            const lotteryId = await lottery.getLotteryId()
            expect(lotteryId.toString()).to.equal('1')
        })
    })


});
*/