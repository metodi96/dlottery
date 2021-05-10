pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract SUSDMock is ERC20 {
    constructor() ERC20('sUSD Mock Contract', 'sUSD') {}
}