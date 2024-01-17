// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Lottery {
    address public owner;
    uint public constant TICKET_PRICE = 0.01 ether;

    struct Item {
        uint id;
        string name;
        bool isDrawn;
        address payable winner;
    }

    Item[3] public items;
    mapping(uint => address payable[]) private bids;

    event BidReceived(uint indexed itemId, address indexed bidder);
    event WinnerDeclared(uint indexed itemId, address indexed winner);

    constructor() {
        owner = msg.sender;
        items[0] = Item(0, "Car", false, payable(address(0)));
        items[1] = Item(1, "Phone", false, payable(address(0)));
        items[2] = Item(2, "Computer", false, payable(address(0)));
    }

    modifier isOwner() {
        require(msg.sender == owner, "Only the owner can perform this action");
        _;
    }

    function bid(uint itemId) external payable {
        require(itemId < items.length, "Item does not exist");
        require(msg.value == TICKET_PRICE, "Incorrect ticket price");
        require(!items[itemId].isDrawn, "Drawing already done for this item");

        bids[itemId].push(payable(msg.sender));
        emit BidReceived(itemId, msg.sender);
    }

    function declareWinner(uint itemId) public isOwner {
        require(itemId < items.length, "Item does not exist");
        require(!items[itemId].isDrawn, "Winner already declared for this item");
        require(bids[itemId].length > 0, "No bids for this item");

        uint randomIndex = random() % bids[itemId].length;
        address payable winner = bids[itemId][randomIndex];
        items[itemId].winner = winner;
        items[itemId].isDrawn = true;

        emit WinnerDeclared(itemId, winner);
    }

    function withdraw() public isOwner {
        payable(owner).transfer(address(this).balance);
    }

    function random() private view returns (uint) {
        return uint(keccak256(abi.encodePacked(block.difficulty, block.timestamp, owner)));
    }
}