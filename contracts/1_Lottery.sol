// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.19;

contract Lottery {
    address public manager;
    mapping(string => address payable[]) public bids;
    mapping(string => address) private winners;
    string[] public items = ["Car", "Phone", "Computer"];

    event BidPlaced(string item, address bidder);
    event WinnerPicked(string item, address winner);

    constructor() {
        manager = msg.sender;
    }

    function bid(string memory item) public payable {
        require(msg.value == 0.01 ether, "Bid must be exactly 0.01 ether");
        require(isValidItem(item), "Invalid item");
        bids[item].push(payable(msg.sender));
        emit BidPlaced(item, msg.sender);
    }

    function pickWinners() public restricted {
        require(address(this).balance > 0, "No funds to distribute");
        uint prizeAmount = address(this).balance / items.length;
        
        for (uint i = 0; i < items.length; i++) {
            if (bids[items[i]].length > 0) {
                uint index = random() % bids[items[i]].length;
                winners[items[i]] = bids[items[i]][index];
                payable(winners[items[i]]).transfer(prizeAmount);
                emit WinnerPicked(items[i], winners[items[i]]);
                bids[items[i]] = new address payable[](0);
            }
        }
    }

    function checkMyWins() public view returns (string memory) {
        string memory myWins;
        for (uint i = 0; i < items.length; i++) {
            if (winners[items[i]] == msg.sender) {
                myWins = string(abi.encodePacked(myWins, items[i], " "));
            }
        }
        return myWins;
    }

    function random() private view returns (uint) {
        return uint(keccak256(abi.encodePacked(block.timestamp, block.difficulty, msg.sender)));
    }

    modifier restricted() {
        require(msg.sender == manager, "This function is restricted to the manager");
        _;
    }

    function withdraw() public restricted {
        uint amount = address(this).balance;
        require(amount > 0, "No funds to withdraw");
        payable(manager).transfer(amount);
    }

    function getBids(string memory item) public view returns (address payable[] memory) {
        require(isValidItem(item), "Invalid item");
        return bids[item];
    }

    function startNewLottery() public restricted {
        for (uint i = 0; i < items.length; i++) {
            bids[items[i]] = new address payable[](0);
        }
    }

    function transferOwnership(address newOwner) public restricted {
        require(newOwner != address(0), "New owner is the zero address");
        manager = newOwner;
    }

    function destroyContract() public restricted {
        selfdestruct(payable(manager));
    }

    function isValidItem(string memory item) private view returns (bool) {
        for (uint i = 0; i < items.length; i++) {
            if (keccak256(bytes(items[i])) == keccak256(bytes(item))) {
                return true;
            }
        }
        return false;
    }
}