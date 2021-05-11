const Lottery = artifacts.require('Lottery')

module.exports = async (deployer, network, [owner]) => {
    // Local (development) networks need their own deployment of the LINK
    // token and the Oracle contract
    console.log('Network', network)
    if (!network.startsWith('rinkeby')) {
        console.log("Only for Rinkeby right now!")
    } else {
        // For now, this is hard coded to Rinkeby
        const RINKEBY_KEYHASH = '0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4'
        const RINKEBY_LINK_TOKEN = '0x01be23585060835e02b77ef475b0cc51aa1e0709'
        const RINKEBY_VRF_COORDINATOR = '0x2ed0feb3e7fd2022120aa84fab1945545a9f2ffc9076fd6156fa96eaff4c1311'
        const RINKBY_SUSD = '0x0CBfA1be7c6ed281EF2BFA1f3F13B944d19513cC'
        deployer.deploy(Lottery, RINKBY_SUSD, RINKEBY_VRF_COORDINATOR, RINKEBY_LINK_TOKEN, RINKEBY_KEYHASH)
    }
}