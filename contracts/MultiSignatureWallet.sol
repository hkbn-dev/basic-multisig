//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "hardhat/console.sol";

/**
    Simple 2 of 3 MultiSignature wallet to approve only one transaction sending Ether at a time.
 */
contract MultiSignatureWallet {
    address[3] public signatures;
    mapping(address => bool) signatureToApproval;
    mapping(address => bool) signatureToVoted;
    bool private contestingApproval = false;
    address payable private currentRecipient; 
    uint minimumSignaturesRequired = 2;
    uint maximumSignaturesAllowed = 3;
    uint currentApprovedSignatures;
    receive() external payable {}
    fallback() external payable {}

    constructor(address _signer1, address _signer2, address _signer3) {
        signatures[0] = _signer1;
        signatures[1] = _signer2;
        signatures[2] = _signer3;
        currentRecipient = payable(address(this));
        currentApprovedSignatures = 0;
    }

    modifier onlyOwner {
        require(msg.sender == signatures[0] || msg.sender == signatures[1] || msg.sender == signatures[2]);
        _;
    }

    modifier notContestingApproval {
        require(!contestingApproval);
        _;
    }

    modifier isContestingApproval {
        require(contestingApproval);
        _;
    }

    function getBalance() public view returns (uint) {
        return address(this).balance;
    }

    function getCurrentRecipient() public view returns(address) {
        return currentRecipient;
    }


    function resetApprovalsAndCurrentRecipient() private {
        for (uint i = 0; i < maximumSignaturesAllowed; i++) {
            address currentSignature = signatures[i];
            signatureToVoted[currentSignature] = false;
            signatureToApproval[currentSignature] = false;
        }
        currentRecipient = payable(address(this));
    }

    function sendEther() private  {
        (bool sent, bytes memory data) = currentRecipient.call{value: getBalance()}("");
        require(sent, "Failed to send Ether");

        resetApprovalsAndCurrentRecipient();
    }

    function countApprovedAndDisprovedVotes() private view returns(uint, uint) {
        uint approvedCount = 0;
        uint disapprovedCount = 0;
        for (uint i = 0; i < maximumSignaturesAllowed; i++) {
            address currentSignature = signatures[i];
            if (signatureToVoted[currentSignature]) {
                if (signatureToApproval[currentSignature]) {
                    approvedCount++;
                }
                else {
                    disapprovedCount++;
                }
            }
        }

        return (approvedCount, disapprovedCount);
    }


    function proposeTransaction(address payable _to) public onlyOwner notContestingApproval {
        currentRecipient = _to;
        contestingApproval = true;
    }

    function approveTransaction() public onlyOwner isContestingApproval {
        signatureToApproval[msg.sender] = true;
        signatureToVoted[msg.sender] = true;
        executeTransactionIfPossible();
    }

    function disapproveTransaction() public onlyOwner isContestingApproval {
        signatureToApproval[msg.sender] = false;
        signatureToVoted[msg.sender] = true;
        executeTransactionIfPossible();
    }

    function executeTransactionIfPossible() private {
        (uint approvedCount, uint disapprovedCount) = countApprovedAndDisprovedVotes();
        if (approvedCount == 2) {
            sendEther();
        }
        else if (disapprovedCount == 2) {
            resetApprovalsAndCurrentRecipient();
        }
    }

}
