"""Tests for utility functions."""

import pytest
from src.utils.contract_utils import (
    format_contract_address,
    get_contract_type_from_abi,
    validate_contract_address,
)
from src.utils.network_utils import (
    get_block_time,
    get_chain_id,
    get_explorer_url,
    get_gas_limit,
    get_mainnet_networks,
    get_native_token,
    get_network_config,
    get_network_info,
    get_supported_networks,
    get_testnet_networks,
    is_testnet,
    validate_network,
)


class TestNetworkUtils:
    """Test cases for network utility functions."""

    def test_get_network_config_valid(self):
        """Test getting valid network configuration."""
        config = get_network_config("ethereum")
        assert config["name"] == "Ethereum Mainnet"
        assert config["chain_id"] == 1
        assert config["native_token"] == "ETH"
        assert not config["is_testnet"]

    def test_get_network_config_invalid(self):
        """Test getting invalid network configuration."""
        with pytest.raises(ValueError, match="Unsupported network"):
            get_network_config("invalid_network")

    def test_get_supported_networks(self):
        """Test getting supported networks list."""
        networks = get_supported_networks()
        assert "ethereum" in networks
        assert "polygon" in networks
        assert "bsc" in networks
        assert "avalanche" in networks
        assert "arbitrum" in networks
        assert "optimism" in networks
        assert "goerli" in networks
        assert "mumbai" in networks

    def test_validate_network_valid(self):
        """Test validating valid networks."""
        assert validate_network("ethereum") is True
        assert validate_network("polygon") is True
        assert validate_network("bsc") is True
        assert validate_network("goerli") is True

    def test_validate_network_invalid(self):
        """Test validating invalid networks."""
        assert validate_network("invalid_network") is False
        assert validate_network("") is False
        assert validate_network(None) is False

    def test_get_network_info(self):
        """Test getting network information."""
        info = get_network_info("ethereum")
        assert info["name"] == "Ethereum Mainnet"
        assert info["chain_id"] == 1
        assert info["network"] == "ethereum"
        assert info["is_testnet"] is False
        assert info["native_token"] == "ETH"

    def test_get_network_info_invalid(self):
        """Test getting network info for invalid network."""
        with pytest.raises(ValueError, match="Unsupported network"):
            get_network_info("invalid_network")

    def test_get_chain_id(self):
        """Test getting chain ID."""
        assert get_chain_id("ethereum") == 1
        assert get_chain_id("polygon") == 137
        assert get_chain_id("bsc") == 56
        assert get_chain_id("goerli") == 5

    def test_get_explorer_url(self):
        """Test getting explorer URL."""
        assert get_explorer_url("ethereum") == "https://etherscan.io"
        assert get_explorer_url("polygon") == "https://polygonscan.com"
        assert get_explorer_url("bsc") == "https://bscscan.com"

    def test_get_native_token(self):
        """Test getting native token."""
        assert get_native_token("ethereum") == "ETH"
        assert get_native_token("polygon") == "MATIC"
        assert get_native_token("bsc") == "BNB"
        assert get_native_token("avalanche") == "AVAX"

    def test_get_block_time(self):
        """Test getting block time."""
        assert get_block_time("ethereum") == 12.0
        assert get_block_time("polygon") == 2.0
        assert get_block_time("bsc") == 3.0
        assert get_block_time("arbitrum") == 0.25

    def test_get_gas_limit(self):
        """Test getting gas limit."""
        assert get_gas_limit("ethereum") == 30000000
        assert get_gas_limit("polygon") == 30000000
        assert get_gas_limit("avalanche") == 8000000
        assert get_gas_limit("arbitrum") == 100000000

    def test_is_testnet(self):
        """Test checking if network is testnet."""
        assert is_testnet("ethereum") is False
        assert is_testnet("polygon") is False
        assert is_testnet("goerli") is True
        assert is_testnet("mumbai") is True

    def test_get_mainnet_networks(self):
        """Test getting mainnet networks."""
        mainnets = get_mainnet_networks()
        assert "ethereum" in mainnets
        assert "polygon" in mainnets
        assert "bsc" in mainnets
        assert "goerli" not in mainnets
        assert "mumbai" not in mainnets

    def test_get_testnet_networks(self):
        """Test getting testnet networks."""
        testnets = get_testnet_networks()
        assert "goerli" in testnets
        assert "mumbai" in testnets
        assert "ethereum" not in testnets
        assert "polygon" not in testnets


class TestContractUtils:
    """Test cases for contract utility functions."""

    def test_validate_contract_address_valid(self):
        """Test validating valid contract addresses."""
        valid_addresses = [
            "0x1234567890123456789012345678901234567890",
            "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
            "0x0000000000000000000000000000000000000000",
            "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        ]

        for address in valid_addresses:
            assert validate_contract_address(address) is True

    def test_validate_contract_address_invalid(self):
        """Test validating invalid contract addresses."""
        invalid_addresses = [
            "0x123456789012345678901234567890123456789",  # Too short
            "0x12345678901234567890123456789012345678901",  # Too long
            "1234567890123456789012345678901234567890",  # Missing 0x
            "0x123456789012345678901234567890123456789g",  # Invalid character
            "",  # Empty
            None,  # None
            "invalid_address",  # Completely invalid
        ]

        for address in invalid_addresses:
            assert validate_contract_address(address) is False

    def test_format_contract_address_valid(self):
        """Test formatting valid contract addresses."""
        test_cases = [
            (
                "0x1234567890123456789012345678901234567890",
                "0x1234567890123456789012345678901234567890",
            ),
            (
                "0xABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABCD",
                "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
            ),
            (
                "0x0000000000000000000000000000000000000000",
                "0x0000000000000000000000000000000000000000",
            ),
        ]

        for input_addr, expected in test_cases:
            result = format_contract_address(input_addr)
            assert result == expected

    def test_format_contract_address_invalid(self):
        """Test formatting invalid contract addresses."""
        invalid_addresses = [
            "0x123456789012345678901234567890123456789",  # Too short
            "0x123456789012345678901234567890123456789g",  # Invalid character
            "",  # Empty
            "invalid_address",  # Completely invalid
        ]

        for address in invalid_addresses:
            with pytest.raises(ValueError, match="Invalid contract address format"):
                format_contract_address(address)

    def test_get_contract_type_from_abi_erc20(self):
        """Test getting contract type from ERC20 ABI."""
        erc20_abi = [
            {"type": "function", "name": "transfer"},
            {"type": "function", "name": "approve"},
            {"type": "function", "name": "balanceOf"},
            {"type": "function", "name": "totalSupply"},
        ]

        contract_type = get_contract_type_from_abi(erc20_abi)
        assert contract_type == "erc20"

    def test_get_contract_type_from_abi_erc721(self):
        """Test getting contract type from ERC721 ABI."""
        erc721_abi = [
            {"type": "function", "name": "transfer"},
            {"type": "function", "name": "mint"},
            {"type": "function", "name": "tokenURI"},
        ]

        contract_type = get_contract_type_from_abi(erc721_abi)
        assert contract_type == "erc721"

    def test_get_contract_type_from_abi_bridge(self):
        """Test getting contract type from bridge ABI."""
        bridge_abi = [
            {"type": "function", "name": "deposit"},
            {"type": "function", "name": "withdraw"},
            {"type": "function", "name": "getBalance"},
        ]

        contract_type = get_contract_type_from_abi(bridge_abi)
        assert contract_type == "bridge"

    def test_get_contract_type_from_abi_dex(self):
        """Test getting contract type from DEX ABI."""
        dex_abi = [
            {"type": "function", "name": "swap"},
            {"type": "function", "name": "addLiquidity"},
            {"type": "function", "name": "removeLiquidity"},
        ]

        contract_type = get_contract_type_from_abi(dex_abi)
        assert contract_type == "dex"

    def test_get_contract_type_from_abi_lending(self):
        """Test getting contract type from lending ABI."""
        lending_abi = [
            {"type": "function", "name": "lend"},
            {"type": "function", "name": "borrow"},
            {"type": "function", "name": "repay"},
        ]

        contract_type = get_contract_type_from_abi(lending_abi)
        assert contract_type == "lending"

    def test_get_contract_type_from_abi_staking(self):
        """Test getting contract type from staking ABI."""
        staking_abi = [
            {"type": "function", "name": "stake"},
            {"type": "function", "name": "unstake"},
            {"type": "function", "name": "claimRewards"},
        ]

        contract_type = get_contract_type_from_abi(staking_abi)
        assert contract_type == "staking"

    def test_get_contract_type_from_abi_unknown(self):
        """Test getting contract type from unknown ABI."""
        unknown_abi = [
            {"type": "function", "name": "someFunction"},
            {"type": "function", "name": "anotherFunction"},
        ]

        contract_type = get_contract_type_from_abi(unknown_abi)
        assert contract_type == "unknown"

    def test_get_contract_type_from_abi_empty(self):
        """Test getting contract type from empty ABI."""
        contract_type = get_contract_type_from_abi([])
        assert contract_type == "unknown"

    def test_get_contract_type_from_abi_none(self):
        """Test getting contract type from None ABI."""
        contract_type = get_contract_type_from_abi(None)
        assert contract_type == "unknown"
