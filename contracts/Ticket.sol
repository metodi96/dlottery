pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@chainlink/contracts/src/v0.8/dev/VRFConsumerBase.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Ticket is ERC721Enumerable, VRFConsumerBase {
    using Counters for Counters.Counter;

    //sUSD token
    IERC20 sUSD;

    // Counter for token ids
    Counters.Counter private ticketIds;

    // Counter for lottery ids
    Counters.Counter private lotteryIds;

    uint private duration = 1 weeks;

    bytes32 internal keyHash;
    uint256 internal fee;
    uint256 public randomWinner;

    mapping (uint256 => uint256) public lotteryIdToPool;
    mapping (uint256 => uint256) public lotteryIdToExpiry;
    mapping(uint256 => bool) tokenIdToFirstPlace;
    mapping(uint256 => bool) tokenIdToSecondPlace;
    mapping(uint256 => bool) tokenIdToThirdPlace;

    event LotteryCreated(uint256 lotteryId, uint256 startDate, uint256 endDate);

    constructor(address sUSDAddress) {
        sUSD = IERC20(sUSDAddress);
    }

    function buyTicket(address to) public returns (uint256) {
       //check if the current lottery has expired and if yes, increment the lottery id and set the new expiration date to next week 
       //and then you just buy a ticket for the new lottery
       if (lotteryIdToExpiry[lotteryIds] > block.timestamp) {
           lotteryIds.increment();
           lotteryIdToExpiry[lotteryIds] = block.timestamp + duration;
       } 
        uint256 amount = 1000000000000000000;
        //transfer 1 sUSD to the lottery smart contract
        sUSD.transfer(address(this), amount);
        lotteryIdToPool[lotteryIds] += amount;

        tokenIds.increment();
        uint256 newItemId = tokenIds.current();

        _mint(to, newItemId);

        emit TicketBought(to, newItemId, lotteryIds);
    }

    function claimFirstPlacePrize(uint256 tokenId) public {
        require(tokenIdToFirstPlace[tokenId], "This tokenId has not won the first place!");
        require(msg.sender == ownerOf(tokenId), "You are not the owner of the tokenId!");
        uint256 balance = address(this).balance;
        sUSD.transferFrom(address(this), msg.sender, balance);
        setFirstPlace(0x0);
    }

    function claimSecondPlacePrize(uint256 tokenId) public {
        require(tokenIdToSecondPlace[tokenId], "This tokenId has not won the second place!");
        require(msg.sender == ownerOf(tokenId), "You are not the owner of the tokenId!");
        uint256 balance = address(this).balance;
        sUSD.transferFrom(address(this), msg.sender, balance);
        setSecondPlace(0x0);
    }

    function claimThirdPlacePrize(uint256 tokenId) public {
        require(tokenIdToThirdPlace[tokenId], "This tokenId has not won the third place!");
        require(msg.sender == ownerOf(tokenId), "You are not the owner of the tokenId!");
        uint256 balance = address(this).balance;
        sUSD.transferFrom(address(this), msg.sender, balance);
        setThirdPlace(0x0);
    }

    function setFirstPlace(uint256 _firstPlace) private {
        firstPlace = _firstPlace;
    }

    function setSecondPlace(uint256 _secondPlace) private {
        secondPlace = _secondPlace;
    }

    function setThirdPlace(uint256 _thirdPlace) private {
        thirdPlace = _thirdPlace;
    }

    function announceWinners() public onlyOwner {

    }
} 