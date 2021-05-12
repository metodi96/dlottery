const { expect } = require('chai')
const { expectRevert } = require('@openzeppelin/test-helpers')
const abi = require('ethereumjs-abi')
const { convertTokensToWei } = require('../utils/tokens')
const Lottery = artifacts.require('Lottery')
const SUSDMock = artifacts.require('SUSDMock')
const VRFCoordinatorMock = artifacts.require('VRFCoordinatorMock')
const { LinkToken } = require('@chainlink/contracts/truffle/v0.4/LinkToken')
const helper = require('ganache-time-traveler');
const SECONDS_IN_DAY = 86400;

contract('Lottery', ([owner, participantOne, participantTwo, participantThree, participantFour, participantFive]) => {
    console.log('Owner: ', owner)
    let lottery, vrfCoordinatorMock, seed, link, keyhash, fee, sUSD

    before(async () => {
        keyhash = '0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4'
        fee = '1000000000000000000'
        seed = 123
        sUSD = await SUSDMock.new({ from: owner })
        link = await LinkToken.new({ from: owner })
        console.log('link address', link.address)
        vrfCoordinatorMock = await VRFCoordinatorMock.new(link.address, { from: owner })
        lottery = await Lottery.new(sUSD.address, vrfCoordinatorMock.address, link.address, keyhash, { from: owner })

        //transfer some sUSD to the participants
        console.log('transfer some sUSD to the participants...')
        sUSD.transfer(participantOne, convertTokensToWei('100'), { from: owner })
        sUSD.transfer(participantTwo, convertTokensToWei('100'), { from: owner })
        sUSD.transfer(participantThree, convertTokensToWei('100'), { from: owner })
        sUSD.transfer(participantFour, convertTokensToWei('100'), { from: owner })
        sUSD.transfer(participantFive, convertTokensToWei('100'), { from: owner })
    })

    describe('Deployment', () => {
        it('Deploys the Lottery contract successfully.', async () => {
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

        it('The lottery SC should have a right lotteryIds.', async () => {
            const lotteryId = await lottery.getLotteryId()
            expect(lotteryId.toString()).to.equal('0')
        })
    })

    describe('Buy a ticket', () => {

        it('The lottery should have no sUSD balance.', async () => {
            const balanceOfLottery = await sUSD.balanceOf(lottery.address)
            assert.equal(balanceOfLottery.toString(), '0', 'The balance of the lottery should be 0')
        })

        it('The lottery pool for the first lottery has no sUSD balance.', async () => {
            const lotteryId = await lottery.getLotteryId()
            const balanceOfLotteryPool = await lottery.lotteryIdToPool(lotteryId)
            assert.equal(balanceOfLotteryPool.toString(), '0', 'The balance of the lottery pool should be 0')
        })

        it('The first participant should have a balance of 100 sUSD.', async () => {
            const balanceOfParticipantOne = await sUSD.balanceOf(participantOne)
            assert.equal(balanceOfParticipantOne.toString(), convertTokensToWei('100'), 'The balance of participant one should be 100')
        })

        it('Returns the id of the new token but doesn\'t actually buy the ticket', async () => {
            await sUSD.approve(lottery.address, convertTokensToWei('1'), { from: participantOne });
            const newTokenId = await lottery.buyTicket.call(participantOne, { from: participantOne })
            assert.equal(newTokenId, 1, 'The new token id should be 1')
        })

        it('Buys a ticket successfully', async () => {
            await sUSD.approve(lottery.address, convertTokensToWei('1'), { from: participantOne });
            const result = await lottery.buyTicket(participantOne, { from: participantOne })
            assert.equal(result.logs.length, 1, 'Should trigger one event.');
            assert.equal(result.logs[0].event, 'Transfer', 'Should be the \'Transfer\' event.');
            assert.equal(result.logs[0].args.from, 0x0000000000000000000000000000000000000000, 'Should be the 0x0000000000000000000000000000000000000000 address.');
            assert.equal(result.logs[0].args.to, participantOne, 'should log the recipient which is the participant one.');
            assert.equal(result.logs[0].args.tokenId, 1, 'should log the token id which is 1.');
        })

        it('The lottery should have a sUSD balance of 1.', async () => {
            const balanceOfLottery = await sUSD.balanceOf(lottery.address)
            assert.equal(balanceOfLottery.toString(), convertTokensToWei('1'), 'The balance of the lottery should be 1')
        })

        it('The lottery pool for the first lottery has a 1 sUSD in it.', async () => {
            const lotteryId = await lottery.getLotteryId()
            const balanceOfLotteryPool = await lottery.lotteryIdToPool(lotteryId)
            assert.equal(balanceOfLotteryPool.toString(), convertTokensToWei('1'), 'The balance of the lottery pool should be 1')
        })

        it('The first participant should have a balance of 99 sUSD.', async () => {
            const balanceOfParticipantOne = await sUSD.balanceOf(participantOne)
            assert.equal(balanceOfParticipantOne.toString(), convertTokensToWei('99'), 'The balance of participant one should be 99')
        })
    })

    describe('Announce Winners', () => {
        before(async () => {
            //buy some more tickets
            await sUSD.approve(lottery.address, convertTokensToWei('4'), { from: participantTwo });
            await sUSD.approve(lottery.address, convertTokensToWei('3'), { from: participantThree });
            await sUSD.approve(lottery.address, convertTokensToWei('5'), { from: participantFour });
            await sUSD.approve(lottery.address, convertTokensToWei('6'), { from: participantFive });
            await lottery.buyTicket(participantTwo, { from: participantTwo })
            await lottery.buyTicket(participantTwo, { from: participantTwo })
            await lottery.buyTicket(participantTwo, { from: participantTwo })
            await lottery.buyTicket(participantTwo, { from: participantTwo })
            await lottery.buyTicket(participantThree, { from: participantThree })
            await lottery.buyTicket(participantThree, { from: participantThree })
            await lottery.buyTicket(participantThree, { from: participantThree })
            await lottery.buyTicket(participantFour, { from: participantFour })
            await lottery.buyTicket(participantFour, { from: participantFour })
            await lottery.buyTicket(participantFour, { from: participantFour })
            await lottery.buyTicket(participantFour, { from: participantFour })
            await lottery.buyTicket(participantFour, { from: participantFour })
            await lottery.buyTicket(participantFive, { from: participantFive })
            await lottery.buyTicket(participantFive, { from: participantFive })
            await lottery.buyTicket(participantFive, { from: participantFive })
            await lottery.buyTicket(participantFive, { from: participantFive })
            await lottery.buyTicket(participantFive, { from: participantFive })
            await lottery.buyTicket(participantFive, { from: participantFive })
        })

        it('it reverts without LINK', async () => {
            await expectRevert.unspecified(
                lottery.announceWinners(seed, { from: owner })
            )
        })

        it('it reverts if lottery has not expired', async () => {
            await link.transfer(lottery.address, web3.utils.toWei('1', 'ether'), { from: owner })
            await expectRevert.unspecified(
                lottery.announceWinners(seed, { from: owner })
            )
        })

        it('Requests and returns a random number using link', async () => {
            const lotteryId = await lottery.getLotteryId()
            await helper.advanceTimeAndBlock(SECONDS_IN_DAY * 7); //advance 7 days
            await link.transfer(lottery.address, web3.utils.toWei('1', 'ether'), { from: owner })
            const requestId = await lottery.announceWinners.call(seed, { from: owner })
            const transaction = await lottery.announceWinners(seed, { from: owner })
            assert.equal(transaction.logs.length, 1, 'Should trigger one event.');
            assert.equal(transaction.logs[0].event, 'VRFRequested', 'Should be the \'VRFRequested\' event.');
            assert.equal(transaction.logs[0].args.requestId, requestId, `Should be the request id: ${requestId}.`);
            assert.equal(transaction.logs[0].args.sender, owner, 'Should be the owner that is calling this function.');
            assert.equal(transaction.logs[0].args.lotteryId, lotteryId.toString(), 'Should be the 0 lottery id.');

            //const randomNumber = Math.floor(Math.random() * parseInt(totalTokens.toString())) + 1
            // let requestId = await randomNumberConsumer.lastRequestId({ from: defaultAccount })
            await vrfCoordinatorMock.callBackWithRandomness(requestId, '2', lottery.address, { from: owner })

            const randomFirstPlace = await lottery.getLotteryIdToFirstPlace(lotteryId.toString(), '9', { from: owner })
            assert.equal(randomFirstPlace, true)
            const randomSecondPlace = await lottery.getLotteryIdToSecondPlace(lotteryId.toString(), '5', { from: owner })
            assert.equal(randomSecondPlace, true)
            const randomThirdPlace = await lottery.getLotteryIdToThirdPlace(lotteryId.toString(), '6', { from: owner })
            assert.equal(randomThirdPlace, true)
        })

        it('There should be a new lottery', async () => {
            const lotteryId = await lottery.getLotteryId()
            assert.equal(lotteryId.toString(), '1', 'The new lottery id should be 1')
        })
    })

    describe('Claim first place reward', () => {

        it('It should revert if token id has not won the first prize for the corresponding lottery.', async () => {
            await expectRevert.unspecified(
                lottery.claimFirstPlacePrize(1, 0, { from: participantFour })
            )
        })

        it('It should revert if the sender is not the owner of the token.', async () => {
            await expectRevert.unspecified(
                lottery.claimFirstPlacePrize(9, 0, { from: participantOne })
            )
        })

        it('It should revert if token has won in lottery 0 but claims reward for lottery 1.', async () => {
            await expectRevert.unspecified(
                lottery.claimFirstPlacePrize(9, 1, { from: participantFour })
            )
        })

        it('The fourth participant should have a balance of 95 sUSD.', async () => {
            const balanceOfParticipantFour = await sUSD.balanceOf(participantFour)
            assert.equal(balanceOfParticipantFour.toString(), convertTokensToWei('95'), 'The balance of participant one should be 95')
        })

        it('Claim the first place reward.', async () => {
            const transaction = await lottery.claimFirstPlacePrize(9, 0, { from: participantFour })
            assert.equal(transaction.logs.length, 1, 'Should trigger one event.');
            assert.equal(transaction.logs[0].event, 'AwardClaimed', 'Should be the \'AwardClaimed\' event.');
            assert.equal(transaction.logs[0].args.eventType, Lottery.EventType.First.toString(), `Should be the First event type`);
            assert.equal(transaction.logs[0].args.tokenId, 9, 'Should be the token id 9');
            assert.equal(transaction.logs[0].args.lotteryId, 0, 'Should be the 0 lottery id.');
        })

        it('The fourth participant should have a balance of 95+19/2 = 103.5 sUSD.', async () => {
            const balanceOfParticipantFour = await sUSD.balanceOf(participantFour)
            assert.equal(balanceOfParticipantFour.toString(), convertTokensToWei('104.5'), 'The balance of participant one should be 104.5')
        })

        it('The fourth participant must not be able to claim reward again.', async () => {
            await expectRevert.unspecified(
                lottery.claimFirstPlacePrize(9, 0, { from: participantFour })
            )
        })
    })

    describe('Claim second place reward', () => {

        it('It should revert if token id has not won the second prize for the corresponding lottery.', async () => {
            await expectRevert.unspecified(
                lottery.claimSecondPlacePrize(4, 0, { from: participantTwo })
            )
        })

        it('It should revert if the sender is not the owner of the token.', async () => {
            await expectRevert.unspecified(
                lottery.claimSecondPlacePrize(5, 0, { from: participantThree })
            )
        })

        it('It should revert if token has won in lottery 0 but claims reward for lottery 1.', async () => {
            await expectRevert.unspecified(
                lottery.claimSecondPlacePrize(5, 1, { from: participantTwo })
            )
        })

        it('The third participant should have a balance of 96 sUSD before claiming.', async () => {
            const balanceOfParticipantTwo = await sUSD.balanceOf(participantTwo)
            assert.equal(balanceOfParticipantTwo.toString(), convertTokensToWei('96'), 'The balance of participant two should be 96 before claiming.')
        })

        it('Claim the second place reward.', async () => {
            const transaction = await lottery.claimSecondPlacePrize(5, 0, { from: participantTwo })
            assert.equal(transaction.logs.length, 1, 'Should trigger one event.');
            assert.equal(transaction.logs[0].event, 'AwardClaimed', 'Should be the \'AwardClaimed\' event.');
            assert.equal(transaction.logs[0].args.eventType, Lottery.EventType.Second.toString(), `Should be the Second event type`);
            assert.equal(transaction.logs[0].args.tokenId, 5, 'Should be the token id 5');
            assert.equal(transaction.logs[0].args.lotteryId, 0, 'Should be the 0 lottery id.');
        })

        it('The second participant should have a balance of 96+19*0.35 = 102.65 sUSD.', async () => {
            const balanceOfParticipantTwo = await sUSD.balanceOf(participantTwo)
            assert.equal(balanceOfParticipantTwo.toString(), convertTokensToWei('102.65'), 'The balance of participant two should be 102.65 after claiming the reward.')
        })

        it('The second participant must not be able to claim reward again.', async () => {
            await expectRevert.unspecified(
                lottery.claimSecondPlacePrize(5, 0, { from: participantTwo })
            )
        })
    })

    describe('Claim third place reward', () => {
        it('It should revert if token id has not won the third prize for the corresponding lottery.', async () => {
            await expectRevert.unspecified(
                lottery.claimFirstPlacePrize(9, 0, { from: participantThree })
            )
        })

        it('It should revert if the sender is not the owner of the token.', async () => {
            await expectRevert.unspecified(
                lottery.claimFirstPlacePrize(6, 0, { from: participantFour })
            )
        })

        it('It should revert if token has won in lottery 0 but claims reward for lottery 1.', async () => {
            await expectRevert.unspecified(
                lottery.claimFirstPlacePrize(6, 1, { from: participantThree })
            )
        })

        it('The third participant should have a balance of 97 sUSD before claiming.', async () => {
            const balanceOfParticipantThree = await sUSD.balanceOf(participantThree)
            assert.equal(balanceOfParticipantThree.toString(), convertTokensToWei('97'), 'The balance of participant one should be 97.')
        })

        it('Claim the third place reward.', async () => {
            const transaction = await lottery.claimThirdPlacePrize(6, 0, { from: participantThree })
            assert.equal(transaction.logs.length, 1, 'Should trigger one event.');
            assert.equal(transaction.logs[0].event, 'AwardClaimed', 'Should be the \'AwardClaimed\' event.');
            assert.equal(transaction.logs[0].args.eventType, Lottery.EventType.Third.toString(), `Should be the Third event type`);
            assert.equal(transaction.logs[0].args.tokenId, 6, 'Should be the token id 6');
            assert.equal(transaction.logs[0].args.lotteryId, 0, 'Should be the 0 lottery id.');
        })

        it('The third participant should now have a balance of 97+19*0.15 = 99.85 sUSD.', async () => {
            const balanceOfParticipantThree = await sUSD.balanceOf(participantThree)
            assert.equal(balanceOfParticipantThree.toString(), convertTokensToWei('99.85'), 'The balance of participant three should be 99.85.')
        })

        it('The third participant must not be able to claim reward again.', async () => {
            await expectRevert.unspecified(
                lottery.claimFirstPlacePrize(6, 0, { from: participantThree })
            )
        })
    })
})
