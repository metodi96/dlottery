pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@chainlink/contracts/src/v0.8/dev/VRFConsumerBase.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Lottery is ERC721, VRFConsumerBase {
    using Counters for Counters.Counter;
    using SafeMath for uint256;

    //sUSD token
    IERC20 sUSD;

    // Counter for token ids
    Counters.Counter private tokenIds;

    // Counter for lottery ids - used for the winners
    Counters.Counter private lotteryIds;

    uint256 private duration = 1 weeks;

    // Used to identify the proper oracle
    bytes32 internal keyHash;

    // Used for requesting the random number from the oracle
    uint256 internal fee;

    // Mapping to keep track of a certain lottery's pool
    mapping(uint256 => uint256) public lotteryIdToPool;

    // Mapping to keep track of a certain lottery's expiry date
    mapping(uint256 => uint256) public lotteryIdToExpiry;

    // Mappings to check whether for a given lottery a certain token id has won a corresponding prize
    mapping(uint256 => mapping (uint256 => bool)) lotteryIdToTokenIdToFirstPlace;
    mapping(uint256 => mapping (uint256 => bool)) lotteryIdToTokenIdToSecondPlace;
    mapping(uint256 => mapping (uint256 => bool)) lotteryIdToTokenIdToThirdPlace;

    /**
     * @dev Emitted when `firstPlace`, `secondPlace`, `thirdPlace` are awarded for a `lotteryId`.
     */
    event WinnerAnnounced(uint256 firstPlace, uint256 secondPlace, uint256 thirdPlace, uint256 lotteryId);

    // @notice enum that defines the three AwardClaimed event types
    enum EventType {First, Second, Third}

    /**
     * @dev Emitted when `tokenId` has claimed its reward for a `lotteryId`.
     */
    event AwardClaimed(EventType eventType, uint256 tokenId, uint256 lotteryId);

    /**
     * @dev Initializes the contract by setting a `_sUSDAddress` for trading with sUSD, a `_VRFCoordinator` 
     * as a Chainlink's smart contract for retrieving a true random number, a `_LinkToken` that is used
     * to pay the oracle and a `_keyHash` which is useful for identifying the proper oracle. A `name` and a `symbol`d for the 
     * are also set, since we inherit from the ERC721 contract. Furthermore, we set the `fee` to 0.1 LINK and we 
     * initialize the first lottery as soon as the contract is deployed
     */
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
        ERC721("dSynLottery", "DSL")
    {
        keyHash = _keyHash;
        fee = 0.1 * 10**18;
        sUSD = IERC20(_sUSDAddress);
        lotteryIds = 1; 
        lotteryIdToExpiry[lotteryIds] = block.timestamp + duration;
    }

    /**
     * @dev buys a ticket for a `recipient` and transfers 1 sUSD to the smart contract from the sender's balance to purchase the ticket
     *
     * Emits a {Transfer} event - comes from the ERC721 smart contract.
     */
    function buyTicket(address recipient) public returns (uint256) {
        uint256 amount = 1000000000000000000;
        //transfer 1 sUSD to the lottery smart contract
        sUSD.transferFrom(msg.sender, address(this), amount);

        //the amount will be added to the specific lottery pool
        lotteryIdToPool[lotteryIds] += amount;

        tokenIds.increment();
        uint256 newItemId = tokenIds.current();

        _mint(recipient, newItemId);
    }

    /**
     * @dev anounces the winners by requesting a random number from the Chainlink oracle using a `userProvidedSeed`
     *
     * Requirements:
     *
     * - only the owner can announce the winners.
     * - current lottery should have expired
     * - the smart contract should have enough balance to cover the fee
     *
     */
    function announceWinners(uint256 userProvidedSeed) public onlyOwner returns (bytes32) {
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
     * @dev Callback function used by the VRFCoordinator. Determines the winners by taking the random value from the VRF response
     * and expanding it to 3 random values for the top 3 places. Afterwards a new lottery starts automatically.
     *
     * Emits a {WinnersAnnounced} event
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

        emit WinnersAnnounced(firstPlaceToken, secondPlaceToken, thirdPlaceToken, lotteryIds);
        
        //as soon as the event is emitted start the next lottery
        lotteryIds.increment();
        lotteryIdToExpiry[lotteryIds] = block.timestamp + duration;
    }

    /**
     * @dev A function to expand the random result received from the VRF response into 3 values to determine the 3 prize winners
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

    /**
     * @dev claim the first place reward if the token is eligible for it
     *
     * Requirements:
     *
     * - this `tokenId` must be the first place winner for the `lotteryId`
     * - only the owner of the `tokenId` can claim the reward
     *
     * Emits a {AwardClaimed} event
     */
    function claimFirstPlacePrize(uint256 tokenId, uint256 lotteryId) public {
        require(
            lotteryIdToTokenIdToFirstPlace[lotteryId][tokenId],
            "This tokenId has not won the first place for this lottery id or has already claimed the prize!"
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

        emit AwardClaimed(EventType.First, tokenId, lotteryId);
    }

    /**
     * @dev claim the second place reward if the token is eligible for it
     *
     * Requirements:
     *
     * - this `tokenId` must be the second place winner for the `lotteryId`
     * - only the owner of the `tokenId` can claim the reward
     *
     * Emits a {AwardClaimed} event
     */
    function claimSecondPlacePrize(uint256 tokenId, uint256 lotteryId) public {
        require(
            lotteryIdToTokenIdToSecondPlace[lotteryId][tokenId],
            "This tokenId has not won the second place for this lottery id or has already claimed the prize!"
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

        emit AwardClaimed(EventType.Second, tokenId, lotteryId);
    }

    /**
     * @dev claim the third place reward if the token is eligible for it
     *
     * Requirements:
     *
     * - this `tokenId` must be the third place winner for the `lotteryId`
     * - only the owner of the `tokenId` can claim the reward
     *
     * Emits a {AwardClaimed} event
     */
    function claimThirdPlacePrize(uint256 tokenId, uint256 lotteryId) public {
        require(
            lotteryIdToTokenIdToThirdPlace[lotteryId][tokenId],
            "This tokenId has not won the third place for this lottery id or has already claimed the prize!"
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

        emit AwardClaimed(EventType.Third, tokenId, lotteryId);
    }
}
