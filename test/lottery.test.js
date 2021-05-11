const { assert } = require('chai')
const { expectRevert } = require('@openzeppelin/test-helpers')

contract('Lottery', ([owner, participantOne, participantTwo, participantThree, participantFour, participantFive]) => {
    const Lottery = artifacts.require('Lottery')
    const SUSDMock = artifacts.require('SUSDMock')
    const VRFCoordinatorMock = artifacts.require('VRFCoordinatorMock')
    const { LinkToken } = require('@chainlink/contracts/truffle/v0.4/LinkToken')
    console.log('Owner: ', owner)
    let lottery, vrfCoordinatorMock, seed, link, keyhash, fee, sUSD

    describe('Deployment', () => {
        beforeEach(async () => {
            keyhash = '0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4'
            fee = '1000000000000000000'
            seed = 123
            sUSD = await SUSDMock.new({ from: owner })
            link = await LinkToken.new({ from: owner })
            console.log('link address', link.address)
            vrfCoordinatorMock = await VRFCoordinatorMock.new(link.address, { from: owner })
            lottery = await Lottery.new(sUSD.address, vrfCoordinatorMock.address, link.address, keyhash, { from: owner })
        })

        it('it reverts without LINK', async () => {
            await expectRevert.unspecified(
                lottery.announceWinners(seed, { from: owner })
            )
        })
    })
})
