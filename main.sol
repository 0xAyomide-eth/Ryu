// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract Ryu is ERC20{
address public treasury;

constructor (address _treasury) ERC20("RYU","RYU"){
    treasury = _treasury;
     _mint(_treasury, 10000000 * 10 ** decimals());
}

    function faucet(address to) public {
        //_transfers 100RYU tokens to the user
        _transfer(treasury, to, 100 * 10 ** decimals());
    }
}