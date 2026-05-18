// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IStakeToken {
    function mintReward(address to, uint256 amount) external;
}

contract Stakingmech is Ownable {

    IERC20 public stakeToken;
    IStakeToken public rewardMinter;

    uint256 public apr30 = 8;
    uint256 public apr60 = 10;
    uint256 public apr90 = 12;
    uint256 public aprCustom = 7;

    struct StakeInfo {
        uint256 amount;
        uint256 startTime;
        uint256 lockDuration;
        uint256 apr;
        bool active;
    }

    mapping(address => StakeInfo) public stakes;

    event Staked(address indexed user, uint256 amount, uint256 duration);
    event UnStaked(address indexed user, uint256 amount, uint256 reward);

    constructor(address _token) Ownable(msg.sender) {
        stakeToken = IERC20(_token);
        rewardMinter = IStakeToken(_token);
    }

    function _stake(uint256 amount, uint256 duration, uint256 apr) internal {
        require(amount > 0, "cant stake please claim from the faucet");
        require(!stakes[msg.sender].active, "Already have an active stake");
        require(duration >= 1, "minimum is 1 day");

        stakeToken.transferFrom(msg.sender, address(this), amount);

        stakes[msg.sender] = StakeInfo({
            amount: amount,
            startTime: block.timestamp,
            lockDuration: duration * 1 days,
            apr: apr,
            active: true
        });

        emit Staked(msg.sender, amount, duration);
    }

    function stake30(uint256 amount) external {
        _stake(amount, 30, apr30);
    }

    function stake60(uint256 amount) external {
        _stake(amount, 60, apr60);
    }

    function stake90(uint256 amount) external {
        _stake(amount, 90, apr90);
    }

    function stakeCustom(uint256 amount, uint256 duration) external {
        require(duration >= 1 && duration <= 365, "Duration must be 1-365 days");
        _stake(amount, duration, aprCustom);
    }

    function calculateReward(address user) public view returns (uint256) {
        StakeInfo memory s = stakes[user];
        if (!s.active) return 0;

        uint256 elapsed = block.timestamp - s.startTime;

        if (elapsed > s.lockDuration) {
            elapsed = s.lockDuration;
        }

        return (s.amount * s.apr * elapsed) / (365 days * 100);
    }

    function unstake() external {
        StakeInfo memory s = stakes[msg.sender];
        require(s.active, "No active stake");
        require(
            block.timestamp >= s.startTime + s.lockDuration,
            "Tokens are still locked"
        );

        uint256 reward = calculateReward(msg.sender);

        stakes[msg.sender].active = false;

        stakeToken.transfer(msg.sender, s.amount);

        if (reward > 0) {
            rewardMinter.mintReward(msg.sender, reward);
        }

        emit UnStaked(msg.sender, s.amount, reward);
    }

    function setAPRs(uint256 _30, uint256 _60, uint256 _90, uint256 _custom) external onlyOwner {
        apr30 = _30;
        apr60 = _60;
        apr90 = _90;
        aprCustom = _custom;
    }

    function getStake(address user) external view returns (StakeInfo memory) {
        return stakes[user];
    }

}