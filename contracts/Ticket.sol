pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@chainlink/contracts/src/v0.8/dev/VRFConsumerBase.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Ticket is ERC721, VRFConsumerBase {
    using Counters for Counters.Counter;
    using SafeMath for uint256;

    //sUSD token
    IERC20 sUSD;

    // Counter for token ids
    Counters.Counter private tokenIds;

    // Counter for lottery ids
    Counters.Counter private lotteryIds;

    uint256 private duration = 1 weeks;

    // Used to identify the proper Oracle
    bytes32 internal keyHash;
    uint256 internal fee;

    mapping(uint256 => uint256) public lotteryIdToPool;
    mapping(uint256 => uint256) public lotteryIdToExpiry;
    mapping(uint256 => mapping (uint256 => bool)) lotteryIdToTokenIdToFirstPlace;
    mapping(uint256 => mapping (uint256 => bool)) lotteryIdToTokenIdToSecondPlace;
    mapping(uint256 => mapping (uint256 => bool)) lotteryIdToTokenIdToThirdPlace;

    event LotteryCreated(uint256 lotteryId, uint256 startDate, uint256 endDate);

    constructor(
        address _sUSDAddress,
        address _VRFCoordinator,
        address _LinkToken,
        bytes32 _keyHash
    )
        VRFConsumerBase(
            _VRFCoordinator, // VRF Coordinator - Rinkeby
            _LinkToken // LINK Token - Rinkeby
        )
    {
        keyHash = _keyHash;
        fee = 0.1 * 10**18; // 0.1 LINK
        sUSD = IERC20(_sUSDAddress); //0x0CBfA1be7c6ed281EF2BFA1f3F13B944d19513cC - Rinkeby
        lotteryIds = 1; //the first lottery starts as soon as the contract is deployed
        lotteryIdToExpiry[lotteryIds] = block.timestamp + duration; // adjust the expiry date
    }

    function buyTicket(address to) public returns (uint256) {
        /*if (lotteryIdToExpiry[lotteryIds] > block.timestamp) {
            lotteryIds.increment();
            lotteryIdToExpiry[lotteryIds] = block.timestamp + duration;
        }*/
        uint256 amount = 1000000000000000000;
        //transfer 1 sUSD to the lottery smart contract
        sUSD.transferFrom(msg.sender, address(this), amount);

        //the amount will be added to the specific lottery pool
        lotteryIdToPool[lotteryIds] += amount;

        tokenIds.increment();
        uint256 newItemId = tokenIds.current();

        _mint(to, newItemId);
    }

    function claimFirstPlacePrize(uint256 tokenId, uint256 lotteryId) public {
        require(
            lotteryIdToTokenIdToFirstPlace[lotteryId][tokenId],
            "This tokenId has not won the first place for this lottery id!"
        );
        require(
            msg.sender == ownerOf(tokenId),
            "You are not the owner of the tokenId!"
        );
        uint256 balance = lotteryIdToPool[lotteryId];
        uint256 amountToBeTransfered = div(balance, 2);
        sUSD.transfer(msg.sender, amountToBeTransfered);
        lotteryIdToPool[lotteryId] = lotteryIdToPool[lotteryId] - amountToBeTransfered;
        lotteryIdToTokenIdToFirstPlace[lotteryId][tokenId] = false;
    }

    function claimSecondPlacePrize(uint256 tokenId, uint256 lotteryId) public {
        require(
            lotteryIdToTokenIdToSecondPlace[lotteryId][tokenId],
            "This tokenId has not won the second place for this lottery id!"
        );
        require(
            msg.sender == ownerOf(tokenId),
            "You are not the owner of the tokenId!"
        );
        uint256 balance = lotteryIdToPool[lotteryId];
        uint256 amountToBeTransfered = div(mul(balance, 35), 100);
        sUSD.transfer(msg.sender, amountToBeTransfered);
        lotteryIdToPool[lotteryId] = lotteryIdToPool[lotteryId] - amountToBeTransfered;
        lotteryIdToTokenIdToSecondPlace[lotteryId][tokenId] = false;
    }

    function claimThirdPlacePrize(uint256 tokenId, uint256 lotteryId) public {
        require(
            lotteryIdToTokenIdToThirdPlace[lotteryId][tokenId],
            "This tokenId has not won the third place for this lottery id!"
        );
        require(
            msg.sender == ownerOf(tokenId),
            "You are not the owner of the tokenId!"
        );
        uint256 balance = lotteryIdToPool[lotteryId];
        uint256 amountToBeTransfered = div(mul(balance, 15), 100);
        sUSD.transfer(msg.sender, amountToBeTransfered);
        lotteryIdToPool[lotteryId] = lotteryIdToPool[lotteryId] - amountToBeTransfered;
        lotteryIdToTokenIdToThirdPlace[lotteryId][tokenId] = false;
    }

    function announceWinners(uint256 userProvidedSeed)
        public
        onlyOwner
        returns (bytes32)
    {
        require(
            lotteryIdToExpiry[lotteryIds] < block.timestamp,
            "The current lottery is still running!"
        );
        require(
            LINK.balanceOf(address(this)) >= fee,
            "Not enough LINK - fill contract with faucet"
        );
        bytes32 requestId = requestRandomness(keyHash, fee, userProvidedSeed);
        return requestId;
    }

    /**
     * Callback function used by VRF Coordinator
     */
    function fulfillRandomness(bytes32 requestId, uint256 randomness)
        internal
        override
    {
        bytes32[] randomWinners = expand(keccak256(abi.encode(randomness));
        uint256 firstPlaceToken = add(mod(uint256(randomWinners[0]), tokenIds), 1);
        uint256 secondPlaceToken = add(mod(uint256(randomWinners[1]), tokenIds), 1);
        uint256 thirdPlaceToken = add(mod(uint256(randomWinners[2]), tokenIds), 1);

        lotteryIdToTokenIdToFirstPlace[lotteryIds][firstPlaceToken] = true;
        lotteryIdToTokenIdToSecondPlace[lotteryIds][secondPlaceToken] = true;
        lotteryIdToTokenIdToThirdPlace[lotteryIds][thirdPlaceToken] = true;

        //as soon as this is done create the second lottery
        lotteryIds.increment();
        lotteryIdToExpiry[lotteryIds] = block.timestamp + duration;

        emit WinnersAnnounced(firstPlaceToken, secondPlaceToken, thirdPlaceToken);
    }

    /**
     * A function to expand the random result received from the VRF response into 3 values to determine the 3 prize winners
     */
    function expand(bytes32 randomValue)
        private
        pure
        returns (bytes32[] memory expandedValues)
    {
        expandedValues = new bytes32[3];
        for (uint256 i = 0; i < expandedValues.length; i++) {
            expandedValues[i] = keccak256(abi.encode(randomValue, i));
        }
        return expandedValues;
    }
}
