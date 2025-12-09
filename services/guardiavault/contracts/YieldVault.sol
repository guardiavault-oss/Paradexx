// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./adapters/LidoAdapter.sol";
import "./adapters/AaveAdapter.sol";
import "./adapters/ILido.sol";

/**
 * @title YieldVault
 * @dev Yield-generating vault that auto-stakes funds in approved DeFi protocols
 * @notice Earns yield while waiting, charges 1% performance fee on yield
 */
contract YieldVault is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // ============ State Variables ============
    
    uint256 private _nextVaultId;
    mapping(uint256 => YieldVaultData) private _vaults;
    mapping(address => uint256[]) private _ownerVaults; // owner => vaultIds
    mapping(uint256 => uint256) private _guardiaVaultToYieldVault; // guardiaVaultId => yieldVaultId
    
    // Approved staking protocols
    mapping(address => bool) public approvedStakingProtocols;
    mapping(address => address) public protocolTokenMap; // protocol => yield token (e.g., Lido => stETH)
    mapping(address => ProtocolType) public protocolTypes; // protocol => type (LIDO, AAVE, etc.)
    
    // Protocol adapters
    LidoAdapter public lidoAdapter;
    AaveAdapter public aaveAdapter;
    
    // GuardiaVault contract reference for integration
    address public guardiaVault;
    
    // Protocol type enum
    enum ProtocolType {
        NONE,
        LIDO,
        AAVE
    }
    
    // Performance fee: 1% (100 basis points)
    uint256 public constant PERFORMANCE_FEE_BPS = 100; // 1%
    uint256 public constant BPS_DENOMINATOR = 10000;
    
    // Treasury address for fee collection
    address public treasury;
    
    // ============ Structs & Enums ============
    
    struct YieldVaultData {
        address owner;
        uint256 guardiaVaultId; // Reference to GuardiaVault contract vault ID
        address asset; // ERC20 token address (address(0) for native ETH)
        uint256 principal; // Original deposit amount
        uint256 yieldAccumulated; // Total yield earned (after fees)
        uint256 yieldFeeCollected; // Total fees collected
        address stakingProtocol; // Which protocol funds are staked in
        uint256 stakedAmount; // Current staked amount
        uint256 createdAt;
        uint256 lastHarvest; // Last time yield was harvested
        bool isActive;
        bool isNative; // true if native ETH, false if ERC20
    }
    
    // ============ Events ============
    
    event YieldVaultCreated(
        uint256 indexed vaultId,
        address indexed owner,
        address guardiaVaultIdOrAsset,
        address assetOrZero,
        uint256 principal
    );
    
    event FundsStaked(
        uint256 indexed vaultId,
        address indexed stakingProtocol,
        uint256 amount
    );
    
    event YieldAccrued(
        uint256 indexed vaultId,
        uint256 yieldAmount,
        uint256 feeAmount
    );
    
    event VaultTriggered(
        uint256 indexed vaultId,
        uint256 principal,
        uint256 yield,
        uint256 totalAmount
    );
    
    // ============ Custom Errors ============
    
    error VaultNotFound();
    error Unauthorized();
    error InvalidStakingProtocol();
    error InsufficientBalance();
    error InvalidAmount();
    error VaultNotActive();
    error AlreadyTriggered();
    
    // ============ Modifiers ============
    
    modifier onlyVaultOwner(uint256 vaultId) {
        if (!_vaults[vaultId].isActive) revert VaultNotFound();
        if (_vaults[vaultId].owner != msg.sender) revert Unauthorized();
        _;
    }
    
    modifier vaultExists(uint256 vaultId) {
        if (!_vaults[vaultId].isActive) revert VaultNotFound();
        _;
    }
    
    // ============ Constructor ============
    
    constructor(address _treasury) Ownable(msg.sender) {
        treasury = _treasury;
        
        // Deploy adapters
        lidoAdapter = new LidoAdapter();
        aaveAdapter = new AaveAdapter();
        
        // Setup initial protocols
        _setupProtocols();
    }
    
    /**
     * @notice Setup initial approved protocols
     */
    function _setupProtocols() private {
        // Lido for ETH staking
        approvedStakingProtocols[address(lidoAdapter)] = true;
        protocolTokenMap[address(lidoAdapter)] = lidoAdapter.STETH();
        protocolTypes[address(lidoAdapter)] = ProtocolType.LIDO;
        
        // Aave for lending
        approvedStakingProtocols[address(aaveAdapter)] = true;
        protocolTypes[address(aaveAdapter)] = ProtocolType.AAVE;
    }
    
    // ============ Admin Functions ============
    
    /**
     * @notice Set approved staking protocol
     * @param protocol Protocol contract address
     * @param yieldToken Yield token address (e.g., stETH for Lido)
     * @param protocolType Type of protocol (1 = LIDO, 2 = AAVE)
     */
    function setApprovedProtocol(
        address protocol,
        address yieldToken,
        ProtocolType protocolType
    ) external onlyOwner {
        approvedStakingProtocols[protocol] = true;
        protocolTokenMap[protocol] = yieldToken;
        protocolTypes[protocol] = protocolType;
    }
    
    /**
     * @notice Set GuardiaVault contract address for integration
     * @param _guardiaVault Address of GuardiaVault contract
     */
    function setGuardiaVault(address _guardiaVault) external onlyOwner {
        guardiaVault = _guardiaVault;
    }
    
    /**
     * @notice Set treasury address for fee collection
     * @param _treasury Treasury address
     */
    function setTreasury(address _treasury) external onlyOwner {
        treasury = _treasury;
    }
    
    // ============ Core Functions ============
    
    /**
     * @notice Create yield-generating vault with ERC20 token
     * @param guardiaVaultId Reference to GuardiaVault contract vault ID
     * @param asset ERC20 token to deposit (use address(0) for native ETH)
     * @param amount Amount to deposit
     * @param stakingProtocol Protocol to stake in
     * @return vaultId The ID of the newly created vault
     */
    function createYieldVault(
        uint256 guardiaVaultId,
        address asset,
        uint256 amount,
        address stakingProtocol
    ) external nonReentrant returns (uint256 vaultId) {
        if (amount == 0) revert InvalidAmount();
        if (!approvedStakingProtocols[stakingProtocol]) revert InvalidStakingProtocol();
        
        // Transfer tokens from user (if ERC20)
        if (asset != address(0)) {
            IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);
            _stakeERC20(asset, stakingProtocol, amount);
        } else {
            revert InvalidAmount(); // Use deposit() for native ETH
        }
        
        vaultId = _nextVaultId++;
        
        YieldVaultData storage vault = _vaults[vaultId];
        vault.owner = msg.sender;
        vault.guardiaVaultId = guardiaVaultId;
        vault.asset = asset;
        vault.principal = amount;
        vault.stakingProtocol = stakingProtocol;
        vault.stakedAmount = amount;
        vault.createdAt = block.timestamp;
        vault.lastHarvest = block.timestamp;
        vault.isActive = true;
        vault.isNative = false;
        
        _ownerVaults[msg.sender].push(vaultId);
        _guardiaVaultToYieldVault[guardiaVaultId] = vaultId;
        
        emit YieldVaultCreated(vaultId, msg.sender, asset, asset, amount);
        emit FundsStaked(vaultId, stakingProtocol, amount);
        
        return vaultId;
    }
    
    /**
     * @notice Deposit native ETH and create yield vault
     * @param guardiaVaultId Reference to GuardiaVault contract vault ID
     * @param stakingProtocol Protocol to stake in (must support native ETH)
     * @return vaultId The ID of the newly created vault
     */
    function deposit(
        uint256 guardiaVaultId,
        address stakingProtocol
    ) external payable nonReentrant returns (uint256 vaultId) {
        if (msg.value == 0) revert InvalidAmount();
        if (!approvedStakingProtocols[stakingProtocol]) revert InvalidStakingProtocol();
        
        vaultId = _nextVaultId++;
        
        YieldVaultData storage vault = _vaults[vaultId];
        vault.owner = msg.sender;
        vault.guardiaVaultId = guardiaVaultId;
        vault.asset = address(0); // Native ETH
        vault.principal = msg.value;
        vault.stakingProtocol = stakingProtocol;
        vault.stakedAmount = msg.value;
        vault.createdAt = block.timestamp;
        vault.lastHarvest = block.timestamp;
        vault.isActive = true;
        vault.isNative = true;
        
        _ownerVaults[msg.sender].push(vaultId);
        _guardiaVaultToYieldVault[guardiaVaultId] = vaultId;
        
        // Stake native ETH in protocol
        _stakeNative(stakingProtocol, msg.value);
        
        emit YieldVaultCreated(vaultId, msg.sender, address(uint160(guardiaVaultId)), address(0), msg.value);
        emit FundsStaked(vaultId, stakingProtocol, msg.value);
        
        return vaultId;
    }
    
    /**
     * @notice Stake ERC20 tokens in approved protocol
     */
    function _stakeERC20(address asset, address protocol, uint256 amount) private {
        ProtocolType protocolType = protocolTypes[protocol];
        
        if (protocolType == ProtocolType.AAVE) {
            // Supply tokens via Aave adapter
            IERC20(asset).safeIncreaseAllowance(address(aaveAdapter), amount);
            aaveAdapter.supply(asset, amount);
            // aTokens are transferred to this contract by adapter
        } else {
            revert InvalidStakingProtocol();
        }
    }
    
    /**
     * @notice Stake native ETH in approved protocol
     */
    function _stakeNative(address protocol, uint256 amount) private {
        ProtocolType protocolType = protocolTypes[protocol];
        
        if (protocolType == ProtocolType.LIDO) {
            // Stake ETH via Lido adapter
            require(address(this).balance >= amount, "Insufficient balance");
            lidoAdapter.stakeETH{value: amount}();
            // stETH is transferred to this contract by adapter
        } else {
            revert InvalidStakingProtocol();
        }
    }
    
    /**
     * @notice Internal function to harvest yield (called by updateYield or automatically)
     */
    function _harvest(uint256 vaultId) internal {
        YieldVaultData storage vault = _vaults[vaultId];
        if (!vault.isActive) return;
        
        uint256 currentValue = _queryProtocolValue(vaultId);
        
        if (currentValue <= vault.principal) {
            // No yield or loss - update last harvest time
            vault.lastHarvest = block.timestamp;
            return;
        }
        
        uint256 totalYield = currentValue - vault.principal;
        uint256 newYield = totalYield - vault.yieldAccumulated;
        
        if (newYield > 0) {
            uint256 fee = (newYield * PERFORMANCE_FEE_BPS) / BPS_DENOMINATOR;
            uint256 netYield = newYield - fee;
            
            vault.yieldAccumulated += netYield;
            vault.yieldFeeCollected += fee;
            vault.lastHarvest = block.timestamp;
            
            // Transfer fee to treasury
            if (treasury != address(0) && fee > 0) {
                if (vault.isNative) {
                    (bool success, ) = treasury.call{value: fee}("");
                    require(success, "Fee transfer failed");
                } else {
                    IERC20(vault.asset).safeTransfer(treasury, fee);
                }
            }
            
            emit YieldAccrued(vaultId, newYield, fee);
        }
    }
    
    /**
     * @notice Query protocol for current value of staked funds
     * @param vaultId Vault ID to query
     * @return Current value in original asset terms
     */
    function _queryProtocolValue(uint256 vaultId) private view returns (uint256) {
        YieldVaultData storage vault = _vaults[vaultId];
        ProtocolType protocolType = protocolTypes[vault.stakingProtocol];
        
        if (protocolType == ProtocolType.LIDO) {
            // Get stETH balance and convert to ETH value
            uint256 stETHBalance = lidoAdapter.getBalance(address(this));
            if (stETHBalance > 0) {
                return lidoAdapter.getETHValue(stETHBalance);
            }
            return vault.principal;
        } else if (protocolType == ProtocolType.AAVE) {
            // Get aToken balance and convert to underlying
            // For Aave, aToken balance is already in underlying terms after accounting for interest
            uint256 aTokenBalance = aaveAdapter.getBalance(vault.asset, address(this));
            return aTokenBalance > 0 ? aTokenBalance : vault.principal;
        }
        
        return vault.principal;
    }
    
    /**
     * @notice Update yield accumulation (called periodically by off-chain service)
     * @param vaultId The vault to update
     * @param newTotalValue Total value including yield
     */
    function updateYield(uint256 vaultId, uint256 newTotalValue) external nonReentrant vaultExists(vaultId) {
        YieldVaultData storage vault = _vaults[vaultId];
        
        if (newTotalValue <= vault.principal) {
            // No yield or loss - update last harvest time
            vault.lastHarvest = block.timestamp;
            return;
        }
        
        uint256 totalYield = newTotalValue - vault.principal;
        uint256 newYield = totalYield - vault.yieldAccumulated;
        
        if (newYield > 0) {
            uint256 fee = (newYield * PERFORMANCE_FEE_BPS) / BPS_DENOMINATOR;
            uint256 netYield = newYield - fee;
            
            vault.yieldAccumulated += netYield;
            vault.yieldFeeCollected += fee;
            vault.lastHarvest = block.timestamp;
            
            // Transfer fee to treasury
            if (treasury != address(0) && fee > 0) {
                if (vault.isNative) {
                    (bool success, ) = treasury.call{value: fee}("");
                    require(success, "Fee transfer failed");
                } else {
                    IERC20(vault.asset).safeTransfer(treasury, fee);
                }
            }
            
            emit YieldAccrued(vaultId, newYield, fee);
        }
    }
    
    /**
     * @notice Harvest yield manually (public function for owner or keeper)
     */
    function harvest(uint256 vaultId) external vaultExists(vaultId) {
        YieldVaultData storage vault = _vaults[vaultId];
        require(vault.owner == msg.sender || msg.sender == owner(), "Not authorized");
        _harvest(vaultId);
    }
    
    /**
     * @notice Trigger vault (called by GuardiaVault when death/inactivity detected)
     * @param vaultId The vault to trigger
     * @param beneficiary Address to receive the funds
     * @return totalAmount Total amount (principal + yield) to return
     */
    function triggerVault(uint256 vaultId, address beneficiary) external nonReentrant vaultExists(vaultId) returns (uint256) {
        YieldVaultData storage vault = _vaults[vaultId];
        
        // Verify caller is GuardiaVault contract
        require(msg.sender == guardiaVault || msg.sender == vault.owner, "Not authorized");
        require(beneficiary != address(0), "Invalid beneficiary");
        
        // Final yield update before withdrawal
        // In production, this would query the protocol one last time
        // For now, we use the accumulated yield
        
        uint256 totalValue = vault.principal + vault.yieldAccumulated;
        
        // Unstake from protocol
        _unstakeFunds(vaultId);
        
        // Transfer to beneficiary
        if (vault.isNative) {
            (bool success, ) = beneficiary.call{value: totalValue}("");
            require(success, "ETH transfer failed");
        } else {
            IERC20(vault.asset).safeTransfer(beneficiary, totalValue);
        }
        
        vault.isActive = false;
        
        emit VaultTriggered(vaultId, vault.principal, vault.yieldAccumulated, totalValue);
        
        return totalValue;
    }
    
    /**
     * @notice Withdraw funds (only owner, before trigger)
     * @param vaultId The vault to withdraw from
     * @param amount Amount to withdraw (0 for all)
     */
    function withdraw(address beneficiary, uint256 vaultId, uint256 amount) external nonReentrant vaultExists(vaultId) {
        YieldVaultData storage vault = _vaults[vaultId];
        require(vault.owner == msg.sender, "Not owner");
        require(beneficiary != address(0), "Invalid beneficiary");
        
        uint256 withdrawAmount = amount == 0 ? vault.principal : amount;
        require(withdrawAmount <= vault.principal, "Insufficient balance");
        
        // Unstake from protocol
        _unstakeFunds(vaultId);
        
        if (vault.isNative) {
            (bool success, ) = beneficiary.call{value: withdrawAmount}("");
            require(success, "ETH transfer failed");
        } else {
            IERC20(vault.asset).safeTransfer(beneficiary, withdrawAmount);
        }
        
        vault.principal -= withdrawAmount;
        vault.stakedAmount -= withdrawAmount;
        
        // Re-stake remaining funds if any
        if (vault.stakedAmount > 0) {
            if (vault.isNative) {
                _stakeNative(vault.stakingProtocol, vault.stakedAmount);
            } else {
                _stakeERC20(vault.asset, vault.stakingProtocol, vault.stakedAmount);
            }
        }
    }
    
    /**
     * @notice Unstake funds from protocol
     */
    function _unstakeFunds(uint256 vaultId) private {
        YieldVaultData storage vault = _vaults[vaultId];
        
        if (vault.stakedAmount == 0) return;
        
        ProtocolType protocolType = protocolTypes[vault.stakingProtocol];
        
        if (protocolType == ProtocolType.LIDO) {
            // Get stETH balance and withdraw
            uint256 stETHBalance = lidoAdapter.getBalance(address(this));
            if (stETHBalance > 0) {
                lidoAdapter.unstake(stETHBalance);
            }
        } else if (protocolType == ProtocolType.AAVE) {
            // Get aToken balance and withdraw
            address aToken = aaveAdapter.getAToken(vault.asset);
            uint256 aTokenBalance = IERC20(aToken).balanceOf(address(this));
            if (aTokenBalance > 0) {
                aaveAdapter.withdraw(vault.asset, aTokenBalance, address(this));
            }
        }
        
        vault.stakedAmount = 0;
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Get vault information
     */
    function getVault(uint256 vaultId) external view vaultExists(vaultId) returns (
        address owner,
        uint256 guardiaVaultId,
        address asset,
        uint256 principal,
        uint256 yieldAccumulated,
        uint256 yieldFeeCollected,
        address stakingProtocol,
        uint256 stakedAmount,
        uint256 createdAt,
        uint256 lastHarvest,
        bool isNative,
        uint256 totalValue
    ) {
        YieldVaultData storage vault = _vaults[vaultId];
        return (
            vault.owner,
            vault.guardiaVaultId,
            vault.asset,
            vault.principal,
            vault.yieldAccumulated,
            vault.yieldFeeCollected,
            vault.stakingProtocol,
            vault.stakedAmount,
            vault.createdAt,
            vault.lastHarvest,
            vault.isNative,
            vault.principal + vault.yieldAccumulated
        );
    }
    
    /**
     * @notice Get yield vault ID for a GuardiaVault ID
     */
    function getYieldVaultForGuardiaVault(uint256 guardiaVaultId) external view returns (uint256) {
        return _guardiaVaultToYieldVault[guardiaVaultId];
    }
    
    /**
     * @notice Get all vault IDs for an owner
     */
    function getVaultsByOwner(address owner) external view returns (uint256[] memory) {
        return _ownerVaults[owner];
    }
    
    /**
     * @notice Get current APY estimate (from protocol)
     * @param stakingProtocol Protocol address
     * @return APY in basis points (e.g., 520 = 5.2%)
     */
    function getEstimatedAPY(address stakingProtocol) external view returns (uint256) {
        ProtocolType protocolType = protocolTypes[stakingProtocol];
        
        if (protocolType == ProtocolType.LIDO) {
            return lidoAdapter.getCurrentAPY();
        } else if (protocolType == ProtocolType.AAVE) {
            // For Aave, need asset address - return default for now
            // In production, would query specific asset APY
            return aaveAdapter.getCurrentAPY(address(0)); // Would need asset parameter
        }
        
        return 0;
    }
}

