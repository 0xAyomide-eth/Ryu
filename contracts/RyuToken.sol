// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract RYU is ERC20 , Ownable{
    //claim amount
    uint256 public constant Claim_amt = 100 * 10**18;
    uint256 public constant cooldown = 24 hours;

    //track who claimed last
    mapping(address => uint256) public lastclaimed;

    //staking contract address 
    address public stakingContract;

    constructor() ERC20("RYU","RYU") Ownable(msg.sender){
        _mint(msg.sender, 100 * 10** 18);
    } 

    //setting the staking contract to mint rewards
    function setStakingContract(address _staking) external onlyOwner{
        stakingContract = _staking;
    }

    //claiming function
    function claim() external {
require(
    block.timestamp >= lastclaimed[msg.sender] + cooldown,
    "wait 24 hours before you claim again"
);

lastclaimed[msg.sender] = block.timestamp;
_mint(msg.sender,Claim_amt);

    }

//function for staking contract to pay rewards
function mintReward(address to, uint256 amount) external {
    require(msg.sender == stakingContract, "Not authorized");
    _mint(to, amount);
}

}