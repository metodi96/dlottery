pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/presets/ERC20PresetFixedSupply.sol";

contract SUSDMock is ERC20PresetFixedSupply {
    constructor() ERC20PresetFixedSupply('sUSD Mock Contract', 'sUSD', 100000000000000000000000000000000, 0x65A46f39ceE20558349867E91571868ADE0fFFb5) {}
}