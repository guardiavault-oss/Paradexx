#!/usr/bin/env python3
"""
Unified Wallet Dashboard Server
Futuristic minimalistic black/gray/white design
"""

import json
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Any
from fastapi import FastAPI, HTTPException, Request, Query, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
import uvicorn

app = FastAPI(title="Unified Wallet Dashboard", version="2.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# State management
app.state.data = {
    "portfolio": {
        "totalValue": 125430.50,
        "dayChange": 2340.12,
        "dayChangePercent": 1.9,
        "chains": [
            {"id": "eth", "name": "Ethereum", "balance": 45230.50, "symbol": "ETH"},
            {"id": "polygon", "name": "Polygon", "balance": 23450.00, "symbol": "MATIC"},
            {"id": "arbitrum", "name": "Arbitrum", "balance": 31750.00, "symbol": "ETH"},
            {"id": "bsc", "name": "BSC", "balance": 25000.00, "symbol": "BNB"}
        ],
        "assets": [
            {"symbol": "ETH", "name": "Ethereum", "balance": 18.5, "value": 45230.50, "change24h": 2.3},
            {"symbol": "MATIC", "name": "Polygon", "balance": 28500, "value": 23450.00, "change24h": -1.2},
            {"symbol": "USDC", "name": "USD Coin", "balance": 31750, "value": 31750.00, "change24h": 0.01}
        ]
    },
    "security": {
        "score": 92,
        "level": "safe",
        "threats": [],
        "mevSaved": 340.50,
        "scamsBlocked": 2
    },
    "vaults": [
        {
            "id": "vault_1",
            "name": "Family Inheritance",
            "status": "active",
            "value": 50000,
            "nextCheckIn": "2024-01-20T00:00:00Z",
            "checkInFrequency": 30,
            "guardians": [
                {"id": "g1", "address": "0x123...", "name": "Guardian 1", "trustScore": 95, "attested": False},
                {"id": "g2", "address": "0x456...", "name": "Guardian 2", "trustScore": 88, "attested": False},
                {"id": "g3", "address": "0x789...", "name": "Guardian 3", "trustScore": 92, "attested": False}
            ],
            "beneficiaries": [
                {"id": "b1", "address": "0xabc...", "name": "Spouse", "share": 60, "claimed": False},
                {"id": "b2", "address": "0xdef...", "name": "Child", "share": 40, "claimed": False}
            ]
        }
    ],
    "transactions": [
        {
            "id": "tx1",
            "type": "send",
            "from": "0x742d...5892",
            "to": "0x5aAe...eAed",
            "amount": "0.5",
            "asset": "ETH",
            "status": "completed",
            "timestamp": (datetime.now() - timedelta(hours=2)).isoformat(),
            "riskScore": 15,
            "mevProtected": True
        },
        {
            "id": "tx2",
            "type": "swap",
            "from": "ETH",
            "to": "USDC",
            "amount": "1.0",
            "status": "completed",
            "timestamp": (datetime.now() - timedelta(days=1)).isoformat(),
            "riskScore": 22,
            "mevProtected": True
        }
    ],
    "notifications": [
        {
            "id": "n1",
            "type": "vault",
            "title": "Check-in Reminder",
            "message": "Your vault check-in is due in 5 days",
            "timestamp": datetime.now().isoformat(),
            "read": False
        },
        {
            "id": "n2",
            "type": "security",
            "title": "MEV Protection Active",
            "message": "Saved $45 from potential front-running",
            "timestamp": (datetime.now() - timedelta(hours=1)).isoformat(),
            "read": False
        }
    ]
}

# Minimalistic futuristic HTML
DASHBOARD_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GuardianX · Unified Wallet</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        :root {
            --bg-black: #000000;
            --bg-dark: #0a0a0a;
            --bg-gray: #1a1a1a;
            --bg-gray-light: #2a2a2a;
            --text-white: #ffffff;
            --text-gray: #888888;
            --text-gray-light: #cccccc;
            --border-gray: #333333;
            --accent-white: #ffffff;
            --success: #00ff00;
            --warning: #ffff00;
            --error: #ff0000;
            --transition: all 0.2s ease;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: var(--bg-black);
            color: var(--text-white);
            min-height: 100vh;
            overflow-x: hidden;
            line-height: 1.5;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        
        /* Header */
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 60px;
            padding-bottom: 30px;
            border-bottom: 1px solid var(--border-gray);
        }
        
        .logo {
            font-size: 24px;
            font-weight: 600;
            letter-spacing: 2px;
            color: var(--text-white);
        }
        
        .logo span {
            color: var(--text-gray);
        }
        
        .header-actions {
            display: flex;
            gap: 15px;
            align-items: center;
        }
        
        .btn {
            padding: 10px 20px;
            background: transparent;
            border: 1px solid var(--border-gray);
            color: var(--text-white);
            cursor: pointer;
            transition: var(--transition);
            font-size: 14px;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .btn:hover {
            border-color: var(--text-white);
            background: var(--bg-gray-light);
        }
        
        .btn-primary {
            background: var(--text-white);
            color: var(--bg-black);
            border-color: var(--text-white);
        }
        
        .btn-primary:hover {
            background: var(--text-gray-light);
        }
        
        .notification-badge {
            position: relative;
            display: inline-block;
        }
        
        .notification-badge::after {
            content: attr(data-count);
            position: absolute;
            top: -8px;
            right: -8px;
            width: 18px;
            height: 18px;
            background: var(--error);
            color: var(--bg-black);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: bold;
        }
        
        /* Main Grid */
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            gap: 30px;
            margin-bottom: 60px;
        }
        
        .card {
            background: var(--bg-gray);
            border: 1px solid var(--border-gray);
            padding: 30px;
            transition: var(--transition);
            cursor: pointer;
        }
        
        .card:hover {
            border-color: var(--text-white);
            transform: translateY(-2px);
        }
        
        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 25px;
            padding-bottom: 15px;
            border-bottom: 1px solid var(--border-gray);
        }
        
        .card-title {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: var(--text-gray);
            font-weight: 600;
        }
        
        .card-value {
            font-size: 32px;
            font-weight: 300;
            color: var(--text-white);
            margin: 15px 0;
            font-family: 'Courier New', monospace;
        }
        
        .card-change {
            font-size: 14px;
            color: var(--text-gray);
            font-family: 'Courier New', monospace;
        }
        
        .card-change.positive {
            color: var(--success);
        }
        
        .card-change.negative {
            color: var(--error);
        }
        
        /* Security Score */
        .security-score {
            display: flex;
            align-items: center;
            gap: 30px;
        }
        
        .score-circle {
            width: 100px;
            height: 100px;
            position: relative;
        }
        
        .score-circle svg {
            transform: rotate(-90deg);
        }
        
        .score-circle circle {
            fill: none;
            stroke-width: 8;
        }
        
        .score-circle .bg {
            stroke: var(--bg-gray-light);
        }
        
        .score-circle .progress {
            stroke: var(--success);
            stroke-dasharray: 251.2;
            stroke-dashoffset: 251.2;
            transition: stroke-dashoffset 1s ease;
        }
        
        .score-value {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 24px;
            font-weight: 600;
        }
        
        .security-info h3 {
            font-size: 18px;
            margin-bottom: 10px;
        }
        
        .security-info p {
            color: var(--text-gray);
            font-size: 14px;
        }
        
        .security-stats {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-top: 20px;
        }
        
        .stat-item {
            text-align: center;
            padding: 15px;
            background: var(--bg-dark);
            border: 1px solid var(--border-gray);
        }
        
        .stat-value {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 5px;
        }
        
        .stat-label {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: var(--text-gray);
        }
        
        /* Chain List */
        .chain-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-top: 20px;
        }
        
        .chain-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px;
            background: var(--bg-dark);
            border: 1px solid var(--border-gray);
            transition: var(--transition);
        }
        
        .chain-item:hover {
            border-color: var(--text-white);
            background: var(--bg-gray-light);
        }
        
        .chain-name {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .chain-symbol {
            width: 32px;
            height: 32px;
            border: 1px solid var(--border-gray);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }
        
        .chain-balance {
            font-family: 'Courier New', monospace;
            font-size: 14px;
        }
        
        /* Actions */
        .actions {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-top: 20px;
        }
        
        .action-btn {
            padding: 15px;
            background: var(--bg-dark);
            border: 1px solid var(--border-gray);
            color: var(--text-white);
            cursor: pointer;
            transition: var(--transition);
            text-align: center;
            text-transform: uppercase;
            font-size: 11px;
            letter-spacing: 1px;
            font-weight: 600;
        }
        
        .action-btn:hover {
            background: var(--text-white);
            color: var(--bg-black);
            border-color: var(--text-white);
        }
        
        /* Vault Status */
        .vault-status {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        
        .status-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid var(--border-gray);
        }
        
        .status-label {
            color: var(--text-gray);
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .status-value {
            font-family: 'Courier New', monospace;
            font-size: 14px;
        }
        
        .guardians {
            display: flex;
            gap: 10px;
            margin-top: 15px;
        }
        
        .guardian-avatar {
            width: 40px;
            height: 40px;
            border: 1px solid var(--border-gray);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            background: var(--bg-dark);
        }
        
        /* Transactions */
        .transactions {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        
        .transaction-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px;
            background: var(--bg-dark);
            border: 1px solid var(--border-gray);
            transition: var(--transition);
        }
        
        .transaction-item:hover {
            border-color: var(--text-white);
            background: var(--bg-gray-light);
        }
        
        .transaction-info {
            flex: 1;
        }
        
        .transaction-type {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: var(--text-gray);
            margin-bottom: 5px;
        }
        
        .transaction-details {
            font-size: 14px;
            font-family: 'Courier New', monospace;
        }
        
        .transaction-amount {
            font-size: 16px;
            font-weight: 600;
            font-family: 'Courier New', monospace;
        }
        
        /* Modal */
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.9);
            z-index: 1000;
            align-items: center;
            justify-content: center;
        }
        
        .modal.active {
            display: flex;
        }
        
        .modal-content {
            background: var(--bg-gray);
            border: 1px solid var(--border-gray);
            padding: 40px;
            max-width: 500px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
        }
        
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid var(--border-gray);
        }
        
        .modal-title {
            font-size: 18px;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        
        .modal-close {
            background: none;
            border: none;
            color: var(--text-white);
            font-size: 24px;
            cursor: pointer;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .modal-close:hover {
            color: var(--text-gray);
        }
        
        .form-group {
            margin-bottom: 25px;
        }
        
        .form-label {
            display: block;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: var(--text-gray);
            margin-bottom: 10px;
        }
        
        .form-input {
            width: 100%;
            padding: 12px 15px;
            background: var(--bg-dark);
            border: 1px solid var(--border-gray);
            color: var(--text-white);
            font-size: 14px;
            font-family: 'Courier New', monospace;
            transition: var(--transition);
        }
        
        .form-input:focus {
            outline: none;
            border-color: var(--text-white);
            background: var(--bg-gray-light);
        }
        
        .form-row {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 15px;
        }
        
        /* Loading */
        .loading {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid var(--border-gray);
            border-top-color: var(--text-white);
            border-radius: 50%;
            animation: spin 0.6s linear infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .container {
                padding: 20px 15px;
            }
            
            .header {
                flex-direction: column;
                gap: 20px;
                align-items: flex-start;
            }
            
            .grid {
                grid-template-columns: 1fr;
                gap: 20px;
            }
            
            .actions {
                grid-template-columns: repeat(2, 1fr);
            }
            
            .security-score {
                flex-direction: column;
                text-align: center;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="logo">GUARDIAN<span>X</span></div>
            <div class="header-actions">
                <button class="btn notification-badge" data-count="2" onclick="openNotifications()">NOTIFICATIONS</button>
                <button class="btn" onclick="openSettings()">SETTINGS</button>
            </div>
        </div>
        
        <!-- Main Grid -->
        <div class="grid">
            <!-- Portfolio Card -->
            <div class="card">
                <div class="card-header">
                    <div class="card-title">PORTFOLIO</div>
                    <button class="btn" style="padding: 5px 10px; font-size: 10px;" onclick="viewPortfolio()">VIEW ALL</button>
                </div>
                <div class="card-value" id="portfolioValue">$125,430.50</div>
                <div class="card-change positive" id="portfolioChange">+$2,340.12 (+1.9%)</div>
                <div class="chain-list" id="chainList"></div>
                <div class="actions">
                    <button class="action-btn" onclick="openModal('send')">SEND</button>
                    <button class="action-btn" onclick="openModal('receive')">RECEIVE</button>
                    <button class="action-btn" onclick="openModal('swap')">SWAP</button>
                    <button class="action-btn" onclick="openModal('bridge')">BRIDGE</button>
                </div>
            </div>
            
            <!-- Security Card -->
            <div class="card">
                <div class="card-header">
                    <div class="card-title">SECURITY</div>
                    <button class="btn" style="padding: 5px 10px; font-size: 10px;" onclick="viewSecurity()">DETAILS</button>
                </div>
                <div class="security-score">
                    <div class="score-circle">
                        <svg width="100" height="100">
                            <circle class="bg" cx="50" cy="50" r="40"></circle>
                            <circle class="progress" cx="50" cy="50" r="40" id="securityProgress"></circle>
                        </svg>
                        <div class="score-value" id="securityScore">92</div>
                    </div>
                    <div class="security-info">
                        <h3>SECURE</h3>
                        <p>Your wallet is protected</p>
                    </div>
                </div>
                <div class="security-stats">
                    <div class="stat-item">
                        <div class="stat-value">$340.50</div>
                        <div class="stat-label">MEV Saved</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">2</div>
                        <div class="stat-label">Threats Blocked</div>
                    </div>
                </div>
            </div>
            
            <!-- Vault Card -->
            <div class="card">
                <div class="card-header">
                    <div class="card-title">VAULT</div>
                    <button class="btn" style="padding: 5px 10px; font-size: 10px;" onclick="manageVaults()">MANAGE</button>
                </div>
                <div class="vault-status">
                    <div class="status-row">
                        <span class="status-label">Status</span>
                        <span class="status-value">ACTIVE</span>
                    </div>
                    <div class="status-row">
                        <span class="status-label">Value</span>
                        <span class="status-value">$50,000.00</span>
                    </div>
                    <div class="status-row">
                        <span class="status-label">Next Check-in</span>
                        <span class="status-value" id="nextCheckIn">5 days</span>
                    </div>
                    <div class="status-row">
                        <span class="status-label">Guardians</span>
                        <div class="guardians">
                            <div class="guardian-avatar">G1</div>
                            <div class="guardian-avatar">G2</div>
                            <div class="guardian-avatar">G3</div>
                        </div>
                    </div>
                </div>
                <div class="actions">
                    <button class="action-btn" onclick="performCheckIn()">CHECK IN</button>
                    <button class="action-btn" onclick="openModal('guardian')">GUARDIAN</button>
                    <button class="action-btn" onclick="viewBeneficiaries()">BENEFICIARIES</button>
                    <button class="action-btn" onclick="viewMessages()">MESSAGES</button>
                </div>
            </div>
            
            <!-- Transactions Card -->
            <div class="card">
                <div class="card-header">
                    <div class="card-title">TRANSACTIONS</div>
                    <button class="btn" style="padding: 5px 10px; font-size: 10px;" onclick="viewAllTransactions()">VIEW ALL</button>
                </div>
                <div class="transactions" id="transactionsList"></div>
            </div>
        </div>
    </div>
    
    <!-- Send Modal -->
    <div class="modal" id="sendModal">
        <div class="modal-content">
            <div class="modal-header">
                <div class="modal-title">SEND TRANSACTION</div>
                <button class="modal-close" onclick="closeModal('sendModal')">&times;</button>
            </div>
            <form onsubmit="handleSend(event)">
                <div class="form-group">
                    <label class="form-label">Recipient Address</label>
                    <input type="text" class="form-input" placeholder="0x..." required id="sendTo">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Amount</label>
                        <input type="number" step="0.000001" class="form-input" placeholder="0.0" required id="sendAmount">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Asset</label>
                        <select class="form-input" id="sendAsset">
                            <option>ETH</option>
                            <option>USDC</option>
                            <option>MATIC</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <button type="submit" class="btn btn-primary" style="width: 100%;">SEND</button>
                </div>
            </form>
        </div>
    </div>
    
    <!-- Swap Modal -->
    <div class="modal" id="swapModal">
        <div class="modal-content">
            <div class="modal-header">
                <div class="modal-title">SWAP ASSETS</div>
                <button class="modal-close" onclick="closeModal('swapModal')">&times;</button>
            </div>
            <form onsubmit="handleSwap(event)">
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">From</label>
                        <input type="number" step="0.000001" class="form-input" placeholder="0.0" required id="swapFromAmount">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Asset</label>
                        <select class="form-input" id="swapFromAsset">
                            <option>ETH</option>
                            <option>USDC</option>
                            <option>MATIC</option>
                        </select>
                    </div>
                </div>
                <div style="text-align: center; margin: 20px 0;">
                    <div style="font-size: 24px;">↓</div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">To</label>
                        <input type="number" step="0.000001" class="form-input" placeholder="0.0" readonly id="swapToAmount">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Asset</label>
                        <select class="form-input" id="swapToAsset">
                            <option>USDC</option>
                            <option>ETH</option>
                            <option>MATIC</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <div style="font-size: 12px; color: var(--text-gray); margin-bottom: 10px;">
                        Rate: 1 ETH = 2,500 USDC
                    </div>
                    <button type="submit" class="btn btn-primary" style="width: 100%;">SWAP</button>
                </div>
            </form>
        </div>
    </div>
    
    <!-- Bridge Modal -->
    <div class="modal" id="bridgeModal">
        <div class="modal-content">
            <div class="modal-header">
                <div class="modal-title">CROSS-CHAIN BRIDGE</div>
                <button class="modal-close" onclick="closeModal('bridgeModal')">&times;</button>
            </div>
            <form onsubmit="handleBridge(event)">
                <div class="form-group">
                    <label class="form-label">From Network</label>
                    <select class="form-input" id="bridgeFromNetwork" required onchange="updateBridgeQuote()">
                        <option value="ethereum">Ethereum</option>
                        <option value="polygon">Polygon</option>
                        <option value="arbitrum">Arbitrum</option>
                        <option value="optimism">Optimism</option>
                        <option value="bsc">BSC</option>
                    </select>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Amount</label>
                        <input type="number" step="0.000001" class="form-input" placeholder="0.0" required id="bridgeAmount" oninput="updateBridgeQuote()">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Asset</label>
                        <select class="form-input" id="bridgeAsset">
                            <option>ETH</option>
                            <option>USDC</option>
                            <option>MATIC</option>
                        </select>
                    </div>
                </div>
                <div style="text-align: center; margin: 20px 0;">
                    <div style="font-size: 24px;">→</div>
                </div>
                <div class="form-group">
                    <label class="form-label">To Network</label>
                    <select class="form-input" id="bridgeToNetwork" required onchange="updateBridgeQuote()">
                        <option value="polygon">Polygon</option>
                        <option value="ethereum">Ethereum</option>
                        <option value="arbitrum">Arbitrum</option>
                        <option value="optimism">Optimism</option>
                        <option value="bsc">BSC</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Recipient Address</label>
                    <input type="text" class="form-input" placeholder="0x..." required id="bridgeRecipient">
                </div>
                <div id="bridgeQuote" style="padding: 15px; background: var(--bg-dark); border: 1px solid var(--border-gray); margin-bottom: 20px; display: none;">
                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--text-gray); margin-bottom: 10px;">BRIDGE QUOTE</div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span style="color: var(--text-gray);">Fee:</span>
                        <span id="bridgeFee" class="status-value">-</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span style="color: var(--text-gray);">Est. Time:</span>
                        <span id="bridgeTime" class="status-value">-</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span style="color: var(--text-gray);">Security Score:</span>
                        <span id="bridgeSecurity" class="status-value" style="color: var(--success);">-</span>
                    </div>
                </div>
                <div class="form-group">
                    <button type="submit" class="btn btn-primary" style="width: 100%;">BRIDGE</button>
                </div>
            </form>
        </div>
    </div>
    
    <script>
        let data = {};
        
        // Load dashboard data
        async function loadDashboard() {
            try {
                const response = await fetch('/api/dashboard/data');
                data = await response.json();
                updateDashboard();
            } catch (error) {
                console.error('Error loading dashboard:', error);
            }
        }
        
        // Update dashboard UI
        function updateDashboard() {
            // Portfolio
            document.getElementById('portfolioValue').textContent = '$' + formatNumber(data.portfolio.totalValue);
            const change = data.portfolio.dayChange;
            const changePercent = data.portfolio.dayChangePercent;
            const changeEl = document.getElementById('portfolioChange');
            changeEl.textContent = `${change >= 0 ? '+' : ''}$${formatNumber(change)} (${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(1)}%)`;
            changeEl.className = 'card-change ' + (change >= 0 ? 'positive' : 'negative');
            
            // Chains
            const chainList = document.getElementById('chainList');
            chainList.innerHTML = data.portfolio.chains.map(chain => `
                <div class="chain-item">
                    <div class="chain-name">
                        <div class="chain-symbol">${chain.symbol.slice(0, 2)}</div>
                        <div>${chain.name}</div>
                    </div>
                    <div class="chain-balance">$${formatNumber(chain.balance)}</div>
                </div>
            `).join('');
            
            // Security Score
            const score = data.security.score;
            document.getElementById('securityScore').textContent = score;
            const progress = document.getElementById('securityProgress');
            const circumference = 2 * Math.PI * 40;
            const offset = circumference - (score / 100) * circumference;
            progress.style.strokeDashoffset = offset;
            
            // Transactions
            const transactionsList = document.getElementById('transactionsList');
            const recentTxs = data.transactions.slice(0, 3);
            transactionsList.innerHTML = recentTxs.map(tx => `
                <div class="transaction-item">
                    <div class="transaction-info">
                        <div class="transaction-type">${tx.type.toUpperCase()}</div>
                        <div class="transaction-details">${tx.from?.slice(0, 8)}...${tx.from?.slice(-6)} → ${tx.to?.slice(0, 8)}...${tx.to?.slice(-6) || tx.to}</div>
                    </div>
                    <div class="transaction-amount">${tx.amount} ${tx.asset}</div>
                </div>
            `).join('');
            
            // Next check-in
            if (data.vaults.length > 0) {
                const vault = data.vaults[0];
                const nextCheckIn = new Date(vault.nextCheckIn);
                const now = new Date();
                const daysLeft = Math.ceil((nextCheckIn - now) / (1000 * 60 * 60 * 24));
                document.getElementById('nextCheckIn').textContent = daysLeft + ' days';
            }
        }
        
        // Format number
        function formatNumber(num) {
            return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
        
        // Modal functions
        function openModal(type) {
            document.getElementById(type + 'Modal').classList.add('active');
        }
        
        function closeModal(modalId) {
            document.getElementById(modalId).classList.remove('active');
        }
        
        // Handle send transaction
        async function handleSend(event) {
            event.preventDefault();
            const to = document.getElementById('sendTo').value;
            const amount = document.getElementById('sendAmount').value;
            const asset = document.getElementById('sendAsset').value;
            
            // Show loading
            const btn = event.target.querySelector('button[type="submit"]');
            const originalText = btn.textContent;
            btn.innerHTML = '<span class="loading"></span>';
            btn.disabled = true;
            
            try {
                const response = await fetch('/api/transaction/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ to, amount, asset })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert('Transaction sent successfully!');
                    closeModal('sendModal');
                    event.target.reset();
                    loadDashboard();
                } else {
                    alert('Transaction failed: ' + result.error);
                }
            } catch (error) {
                alert('Error: ' + error.message);
            } finally {
                btn.textContent = originalText;
                btn.disabled = false;
            }
        }
        
        // Handle swap
        async function handleSwap(event) {
            event.preventDefault();
            const fromAmount = parseFloat(document.getElementById('swapFromAmount').value);
            const fromAsset = document.getElementById('swapFromAsset').value;
            const toAsset = document.getElementById('swapToAsset').value;
            
            // Calculate swap amount (mock rate)
            const rate = 2500; // 1 ETH = 2500 USDC
            const toAmount = fromAsset === 'ETH' && toAsset === 'USDC' 
                ? fromAmount * rate 
                : fromAmount / rate;
            
            document.getElementById('swapToAmount').value = toAmount.toFixed(6);
            
            const btn = event.target.querySelector('button[type="submit"]');
            const originalText = btn.textContent;
            btn.innerHTML = '<span class="loading"></span>';
            btn.disabled = true;
            
            try {
                await new Promise(resolve => setTimeout(resolve, 1500));
                alert('Swap executed successfully!');
                closeModal('swapModal');
                event.target.reset();
                loadDashboard();
            } catch (error) {
                alert('Error: ' + error.message);
            } finally {
                btn.textContent = originalText;
                btn.disabled = false;
            }
        }
        
        // Handle bridge
        async function handleBridge(event) {
            event.preventDefault();
            const fromNetwork = document.getElementById('bridgeFromNetwork').value;
            const toNetwork = document.getElementById('bridgeToNetwork').value;
            const amount = parseFloat(document.getElementById('bridgeAmount').value);
            const asset = document.getElementById('bridgeAsset').value;
            const recipient = document.getElementById('bridgeRecipient').value;
            
            const btn = event.target.querySelector('button[type="submit"]');
            const originalText = btn.textContent;
            btn.innerHTML = '<span class="loading"></span>';
            btn.disabled = true;
            
            try {
                const response = await fetch('/api/bridge/execute', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        from_network: fromNetwork,
                        to_network: toNetwork,
                        amount: amount,
                        asset: asset,
                        recipient: recipient
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert(`Bridge initiated successfully!\n\nTransaction: ${result.result.transaction_id}\nEstimated time: ${result.result.estimated_completion}`);
                    closeModal('bridgeModal');
                    event.target.reset();
                    loadDashboard();
                } else {
                    alert('Bridge failed: ' + result.error);
                }
            } catch (error) {
                alert('Error: ' + error.message);
            } finally {
                btn.textContent = originalText;
                btn.disabled = false;
            }
        }
        
        // Update bridge quote
        async function updateBridgeQuote() {
            const fromNetwork = document.getElementById('bridgeFromNetwork')?.value;
            const toNetwork = document.getElementById('bridgeToNetwork')?.value;
            const amount = parseFloat(document.getElementById('bridgeAmount')?.value || 0);
            const asset = document.getElementById('bridgeAsset')?.value;
            
            if (!fromNetwork || !toNetwork || amount <= 0) {
                document.getElementById('bridgeQuote').style.display = 'none';
                return;
            }
            
            try {
                const response = await fetch('/api/bridge/quote', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        from_network: fromNetwork,
                        to_network: toNetwork,
                        amount: amount,
                        asset: asset
                    })
                });
                
                const result = await response.json();
                
                if (result.success && result.quote) {
                    const quote = result.quote;
                    document.getElementById('bridgeFee').textContent = '$' + quote.estimated_fee.toFixed(2);
                    document.getElementById('bridgeTime').textContent = quote.estimated_time;
                    document.getElementById('bridgeSecurity').textContent = quote.security_score + '/100';
                    document.getElementById('bridgeQuote').style.display = 'block';
                }
            } catch (error) {
                console.error('Error fetching bridge quote:', error);
            }
        }
        
        // Action functions
        function performCheckIn() {
            fetch('/api/vault/checkin/vault_1', { method: 'POST' })
                .then(() => {
                    alert('Check-in successful! Your vault is secure for another 30 days.');
                    loadDashboard();
                })
                .catch(error => alert('Error: ' + error));
        }
        
        function openNotifications() {
            alert('Notifications:\n\n• Check-in reminder: 5 days remaining\n• MEV Protection: Saved $45');
        }
        
        function openSettings() {
            alert('Settings:\n\n• Security Preferences\n• Guardian Management\n• Notification Settings\n• API Keys');
        }
        
        function viewPortfolio() { alert('Opening portfolio details...'); }
        function viewSecurity() { alert('Opening security details...'); }
        function manageVaults() { alert('Opening vault management...'); }
        function viewBeneficiaries() { alert('Opening beneficiaries...'); }
        function viewMessages() { alert('Opening legacy messages...'); }
        function viewAllTransactions() { alert('Opening transaction history...'); }
        
        // Close modals on outside click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.classList.remove('active');
            }
        });
        
        // Initialize
        loadDashboard();
        setInterval(loadDashboard, 30000); // Refresh every 30 seconds
        
        // Update swap calculation
        document.getElementById('swapFromAmount')?.addEventListener('input', function() {
            const fromAmount = parseFloat(this.value) || 0;
            const fromAsset = document.getElementById('swapFromAsset').value;
            const toAsset = document.getElementById('swapToAsset').value;
            const rate = 2500;
            const toAmount = fromAsset === 'ETH' && toAsset === 'USDC' 
                ? fromAmount * rate 
                : fromAmount / rate;
            document.getElementById('swapToAmount').value = toAmount.toFixed(6);
        });
        
        console.log('🚀 Unified Wallet Dashboard loaded');
    </script>
</body>
</html>
"""

@app.get("/", response_class=HTMLResponse)
async def dashboard():
    """Serve the unified dashboard"""
    return DASHBOARD_HTML

@app.get("/api/dashboard/data")
async def get_dashboard_data():
    """Get dashboard data"""
    return JSONResponse(app.state.data)

@app.get("/api/portfolio")
async def get_portfolio():
    """Get portfolio data"""
    return JSONResponse(app.state.data["portfolio"])

@app.get("/api/security")
async def get_security():
    """Get security status"""
    return JSONResponse(app.state.data["security"])

@app.get("/api/vaults")
async def get_vaults():
    """Get vault data"""
    return JSONResponse({"vaults": app.state.data["vaults"]})

@app.get("/api/transactions")
async def get_transactions():
    """Get transaction history"""
    return JSONResponse({"transactions": app.state.data["transactions"]})

@app.post("/api/transaction/send")
async def send_transaction(request: Request):
    """Send a transaction"""
    data = await request.json()
    
    # Create new transaction
    new_tx = {
        "id": f"tx_{len(app.state.data['transactions']) + 1}",
        "type": "send",
        "from": "0x742d...5892",
        "to": data.get("to"),
        "amount": str(data.get("amount")),
        "asset": data.get("asset"),
        "status": "pending",
        "timestamp": datetime.now().isoformat(),
        "riskScore": 15,
        "mevProtected": True
    }
    
    app.state.data["transactions"].insert(0, new_tx)
    
    return JSONResponse({
        "success": True,
        "transaction": new_tx,
        "message": "Transaction sent successfully"
    })


@app.post("/api/bridge/quote")
async def get_bridge_quote(request: Request):
    """Get bridge quote"""
    try:
        from app.core.cross_chain_bridge_integration import get_cross_chain_bridge_integration
        
        data = await request.json()
        bridge_integration = get_cross_chain_bridge_integration()
        
        if not bridge_integration.initialized:
            await bridge_integration.initialize()
        
        quote = await bridge_integration.get_bridge_quote(
            from_network=data.get("from_network"),
            to_network=data.get("to_network"),
            amount=data.get("amount"),
            asset=data.get("asset", "ETH")
        )
        
        return JSONResponse({
            "success": True,
            "quote": quote
        })
    except Exception as e:
        # Fallback to mock quote
        data = await request.json()
        amount = data.get("amount", 0)
        quote = {
            "from_network": data.get("from_network"),
            "to_network": data.get("to_network"),
            "amount": amount,
            "asset": data.get("asset", "ETH"),
            "estimated_fee": amount * 0.001,
            "estimated_time": "2-5 minutes",
            "bridge_available": True,
            "security_score": 85
        }
        return JSONResponse({
            "success": True,
            "quote": quote
        })


@app.post("/api/bridge/execute")
async def execute_bridge(request: Request):
    """Execute bridge transaction"""
    try:
        from app.core.cross_chain_bridge_integration import get_cross_chain_bridge_integration
        
        data = await request.json()
        bridge_integration = get_cross_chain_bridge_integration()
        
        if not bridge_integration.initialized:
            await bridge_integration.initialize()
        
        result = await bridge_integration.execute_bridge(
            from_network=data.get("from_network"),
            to_network=data.get("to_network"),
            amount=data.get("amount"),
            recipient=data.get("recipient"),
            asset=data.get("asset", "ETH")
        )
        
        # Add to transactions
        if result.get("success"):
            new_tx = {
                "id": f"bridge_{len(app.state.data['transactions']) + 1}",
                "type": "bridge",
                "from": data.get("from_network"),
                "to": data.get("to_network"),
                "amount": str(data.get("amount")),
                "asset": data.get("asset", "ETH"),
                "status": "pending",
                "timestamp": datetime.now().isoformat(),
                "riskScore": result.get("security_score", 85)
            }
            app.state.data["transactions"].insert(0, new_tx)
        
        return JSONResponse(result)
    except Exception as e:
        # Fallback to mock execution
        import hashlib
        data = await request.json()
        tx_hash = "0x" + hashlib.sha256(f"{data}{datetime.now()}".encode()).hexdigest()[:64]
        
        new_tx = {
            "id": f"bridge_{len(app.state.data['transactions']) + 1}",
            "type": "bridge",
            "from": data.get("from_network"),
            "to": data.get("to_network"),
            "amount": str(data.get("amount")),
            "asset": data.get("asset", "ETH"),
            "status": "pending",
            "timestamp": datetime.now().isoformat(),
            "riskScore": 85
        }
        app.state.data["transactions"].insert(0, new_tx)
        
        return JSONResponse({
            "success": True,
            "result": {
                "transaction_id": tx_hash,
                "from_network": data.get("from_network"),
                "to_network": data.get("to_network"),
                "amount": data.get("amount"),
                "asset": data.get("asset", "ETH"),
                "estimated_completion": "2-5 minutes",
                "security_score": 85
            }
        })

@app.post("/api/vault/checkin/{vault_id}")
async def perform_checkin(vault_id: str):
    """Perform vault check-in"""
    for vault in app.state.data["vaults"]:
        if vault["id"] == vault_id:
            # Update check-in date
            next_checkin = datetime.now() + timedelta(days=30)
            vault["nextCheckIn"] = next_checkin.isoformat()
            return JSONResponse({
                "success": True,
                "message": "Check-in successful",
                "nextCheckIn": vault["nextCheckIn"]
            })
    
    raise HTTPException(status_code=404, detail="Vault not found")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "unified-wallet-dashboard"}

if __name__ == "__main__":
    print("\n" + "="*50)
    print("  GUARDIANX · Unified Wallet Dashboard")
    print("="*50)
    print(f"  Dashboard: http://localhost:3000")
    print("="*50 + "\n")
    
    uvicorn.run(app, host="0.0.0.0", port=3000, log_level="info")