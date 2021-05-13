const Lottery = artifacts.require('Lottery')

module.exports = async (deployer, network, [owner]) => {
    // Local (development) networks need their own deployment of the LINK
    // token and the Oracle contract
    console.log('Network', network)
    if (network.startsWith('rinkeby')) {
        // For now, this is hard coded to Rinkeby
        const RINKEBY_KEYHASH = '0x2ed0feb3e7fd2022120aa84fab1945545a9f2ffc9076fd6156fa96eaff4c1311'
        const RINKEBY_LINK_TOKEN = '0x01be23585060835e02b77ef475b0cc51aa1e0709'
        const RINKEBY_VRF_COORDINATOR = '0xb3dCcb4Cf7a26f6cf6B120Cf5A73875B7BBc655B'
        const RINKBY_SUSD = '0x15129620e32336438B396ce3825BcDc8Cef4B8eB'
        deployer.deploy(Lottery, RINKBY_SUSD, RINKEBY_VRF_COORDINATOR, RINKEBY_LINK_TOKEN, RINKEBY_KEYHASH)
    } else if (network.startsWith('kovan')) {
        // For now, this is hard coded to Kovan
        const KOVAN_KEYHASH = '0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4'
        const KOVAN_LINK_TOKEN = '0xa36085f69e2889c224210f603d836748e7dc0088'
        const KOVAN_VRF_COORDINATOR = '0xdD3782915140c8f3b190B5D67eAc6dc5760C46E9'
        const KOVAN_SUSD = '0x57ab1ec28d129707052df4df418d58a2d46d5f51'
        deployer.deploy(Lottery, KOVAN_SUSD, KOVAN_VRF_COORDINATOR, KOVAN_LINK_TOKEN, KOVAN_KEYHASH)
        //contract address: 0xABed09633E407e42F7CB030c552E49d8F22122fA
        //contract address (5min lottery): 0x8e75116B9b2DB58e2e6f8B74987b6975a65f83B4
        //contract address (6h lottery duration): 0x5178d423d878b6fac363426075cEbBE33eC19147
    }
}