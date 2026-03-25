import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IERC5192 {
    function locked(uint256 tokenId) external view returns (bool);
}

contract SoulBoundToken is ERC721, Ownable, IERC5192 {
    uint256 private _tokenIdCounter;
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(IERC5192).interfaceId || super.supportsInterface(interfaceId);
    }

    function locked(uint256 tokenId) public view virtual override returns (bool) {
        require(_exists(tokenId), "Token does not exist");
        return _lockedTokens[tokenId];
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        return _tokenURIs[tokenId];
    }
  
 function mint(address to, string memory tokenURI_) external onlyOwner returns (uint256) {
        require(!hasMinted[to], "Already minted");
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _safeMint(to, tokenId);
        _tokenURIs[tokenId] = tokenURI_;
        _lockedTokens[tokenId] = true;
        
        hasMinted[to] = true;
        voterToTokenId[to] = tokenId;
        
        emit VoterRegistered(to, tokenId);
        emit Locked(tokenId);
        
        return tokenId;
        }
         function mintBatch(address[] calldata recipients, string[] calldata tokenURIs) external onlyOwner {
        require(recipients.length == tokenURIs.length, "Length mismatch");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            require(!hasMinted[recipients[i]], "Already minted");
            
            uint256 tokenId = _tokenIdCounter;
            _tokenIdCounter++;
            
            _safeMint(recipients[i], tokenId);
            _tokenURIs[tokenId] = tokenURIs[i];
            _lockedTokens[tokenId] = true;
            
            hasMinted[recipients[i]] = true;
            voterToTokenId[recipients[i]] = tokenId;
            
            emit VoterRegistered(recipients[i], tokenId);
            emit Locked(tokenId);
        }
    }
 function burn(uint256 tokenId) external onlyOwner {
        require(_exists(tokenId), "Token does not exist");
        address owner = ownerOf(tokenId);
        _burn(tokenId);
        hasMinted[owner] = false;
        emit VoterRemoved(owner);
    }

    function isEligible(address account) external view returns (bool) {
        return hasMinted[account];
    }

    function getTokenId(address account) external view returns (uint256) {
        require(hasMinted[account], "No token");
        return voterToTokenId[account];
    }

    function _burn(uint256 tokenId) internal virtual override {
        super._burn(tokenId);
        delete _tokenURIs[tokenId];
    } 
    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize) internal virtual override {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
        
        if (from != address(0)) {
            require(_lockedTokens[tokenId] == false, "Soulbound: token is locked and cannot be transferred");
        }
    }

    event Locked(uint256 tokenId);
    event Unlocked(uint256 tokenId);
}









