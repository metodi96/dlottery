// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/presets/ERC20PresetFixedSupply.sol";

contract SUSDMock is ERC20PresetFixedSupply {
    constructor() ERC20PresetFixedSupply('sUSD Mock Contract', 'sUSD', 100000000000000000000000000000000, 0x627306090abaB3A6e1400e9345bC60c78a8BEf57) {}
}