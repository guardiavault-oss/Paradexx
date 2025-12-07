"""
Dust Donation Widget for GuardianX
User interface for the Pass It On dust collection feature
"""

import streamlit as st
from typing import Dict, List, Optional, Any
from datetime import datetime
import asyncio
import json

from app.core.dust_collection import (
    get_dust_collection_system,
    DustToken,
    DustDonation
)
from app.core.moralis_integration import get_moralis_api


class DustDonationWidget:
    """
    Interactive widget for dust donation management
    """
    
    def __init__(self):
        self.dust_system = get_dust_collection_system()
        self.moralis_api = get_moralis_api()
    
    def render(self, wallet_address: str):
        """
        Render the dust donation widget
        """
        st.markdown("### 🌟 Pass It On - Dust Donation")
        st.markdown("*Turn your dust into someone's treasure*")
        
        # Create tabs
        tab1, tab2, tab3 = st.tabs(["💝 Donate Dust", "📊 Impact", "🏆 Recipients"])
        
        with tab1:
            self.render_donation_tab(wallet_address)
        
        with tab2:
            self.render_impact_tab()
        
        with tab3:
            self.render_recipients_tab()
    
    def render_donation_tab(self, wallet_address: str):
        """
        Render the donation interface
        """
        col1, col2 = st.columns([2, 1])
        
        with col1:
            st.markdown("#### Your Dust Tokens")
            
            # Scan for dust tokens
            if st.button("🔍 Scan for Dust", key="scan_dust"):
                with st.spinner("Scanning wallet for dust tokens..."):
                    dust_tokens = self.scan_wallet_for_dust(wallet_address)
                    
                    if dust_tokens:
                        st.success(f"Found {len(dust_tokens)} dust tokens!")
                        st.session_state['dust_tokens'] = dust_tokens
                    else:
                        st.info("No dust tokens found (tokens < $1 USD)")
        
        with col2:
            # Display dust summary
            if 'dust_tokens' in st.session_state:
                dust_tokens = st.session_state['dust_tokens']
                total_value = sum(t.usd_value for t in dust_tokens)
                
                st.metric("Total Dust Value", f"${total_value:.2f}")
                st.metric("Dust Tokens", len(dust_tokens))
        
        # Display dust tokens
        if 'dust_tokens' in st.session_state:
            st.markdown("---")
            self.render_dust_token_list(st.session_state['dust_tokens'])
            
            # Donation options
            st.markdown("### 📤 Donation Options")
            
            col1, col2, col3 = st.columns(3)
            
            with col1:
                if st.button("🎯 Quick Donate All", type="primary", use_container_width=True):
                    self.quick_donate_all(wallet_address, st.session_state['dust_tokens'])
            
            with col2:
                if st.button("⚡ Gasless Donation", use_container_width=True):
                    self.gasless_donation(wallet_address, st.session_state['dust_tokens'])
            
            with col3:
                if st.button("🎨 Custom Selection", use_container_width=True):
                    st.session_state['custom_selection_mode'] = True
            
            # Show donation methods explanation
            with st.expander("ℹ️ How does gasless donation work?"):
                st.markdown("""
                **Gasless Donations** use meta-transactions:
                - You sign a message (no gas needed)
                - GuardianX batches multiple donations
                - We pay the gas when threshold is reached
                - Your dust reaches those in need without fees!
                
                **Benefits:**
                - 100% of your dust value is donated
                - No gas fees for you
                - Efficient batching saves ~80% on gas
                - Transparent tracking of impact
                """)
    
    def render_dust_token_list(self, dust_tokens: List[DustToken]):
        """
        Render list of dust tokens
        """
        for token in dust_tokens:
            col1, col2, col3, col4 = st.columns([1, 2, 2, 1])
            
            with col1:
                st.markdown(f"**{token.symbol}**")
            
            with col2:
                st.text(f"{token.formatted_amount}")
            
            with col3:
                st.text(f"${token.usd_value:.4f}")
            
            with col4:
                if 'custom_selection_mode' in st.session_state:
                    st.checkbox("Select", key=f"select_{token.address}")
    
    def render_impact_tab(self):
        """
        Render impact statistics
        """
        # Get gas savings estimate
        savings = asyncio.run(self.dust_system.get_gas_savings_estimate())
        
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            st.metric(
                "Total Donated",
                f"${savings['total_usd_collected']:.2f}",
                f"{savings['total_donations']} donations"
            )
        
        with col2:
            st.metric(
                "Gas Saved",
                f"${savings['usd_saved']:.2f}",
                f"{savings['gas_saved']:,} gas units"
            )
        
        with col3:
            st.metric(
                "Unique Donors",
                savings['unique_donors'],
                "contributors"
            )
        
        with col4:
            st.metric(
                "Batches Processed",
                savings['batches_processed'],
                "efficient batches"
            )
        
        # Show impact chart
        st.markdown("### 📈 Impact Over Time")
        self.render_impact_chart()
        
        # Recent donations
        st.markdown("### 🎁 Recent Donations")
        self.render_recent_donations()
    
    def render_recipients_tab(self):
        """
        Render recipients information
        """
        st.markdown("### 🤝 Recipients in Need")
        st.info("""
        All recipients are verified through our partner organizations.
        Your dust donations help real people in need.
        """)
        
        # Show recipient stories (anonymized)
        recipients = [
            {
                "name": "Family in Venezuela",
                "story": "Supporting a family of 4 during economic crisis",
                "received": "$45.32",
                "impact": "Bought essential groceries for 2 weeks"
            },
            {
                "name": "Student in Nigeria", 
                "story": "University student needing support for studies",
                "received": "$23.18",
                "impact": "Paid for internet access for online classes"
            },
            {
                "name": "Refugee Family",
                "story": "Recently displaced family starting over",
                "received": "$67.89",
                "impact": "Secured temporary accommodation"
            }
        ]
        
        for recipient in recipients:
            with st.container():
                col1, col2 = st.columns([3, 1])
                
                with col1:
                    st.markdown(f"**{recipient['name']}**")
                    st.text(recipient['story'])
                    st.caption(f"Impact: {recipient['impact']}")
                
                with col2:
                    st.metric("Received", recipient['received'])
    
    def scan_wallet_for_dust(self, wallet_address: str) -> List[DustToken]:
        """
        Scan wallet for dust tokens
        """
        try:
            # Get wallet portfolio from Moralis
            portfolio = asyncio.run(
                self.moralis_api.get_wallet_portfolio(wallet_address)
            )
            
            # Identify dust tokens
            dust_tokens = asyncio.run(
                self.dust_system.identify_dust_tokens(
                    wallet_address,
                    portfolio.__dict__
                )
            )
            
            return dust_tokens
            
        except Exception as e:
            st.error(f"Failed to scan wallet: {e}")
            return []
    
    def quick_donate_all(self, wallet_address: str, dust_tokens: List[DustToken]):
        """
        Quick donate all dust tokens
        """
        st.info("Preparing donation signatures...")
        
        # Create donation commitments for all tokens
        commitments = []
        for token in dust_tokens:
            commitment = asyncio.run(
                self.dust_system.create_donation_commitment(
                    wallet_address,
                    token
                )
            )
            commitments.append(commitment)
        
        # Show signing interface
        st.success(f"Ready to donate {len(dust_tokens)} tokens worth ${sum(t.usd_value for t in dust_tokens):.2f}")
        st.markdown("Please sign the donation message in your wallet (no gas required)")
        
        # In production, this would trigger wallet signing
        st.code(json.dumps(commitments[0], indent=2))
    
    def gasless_donation(self, wallet_address: str, dust_tokens: List[DustToken]):
        """
        Process gasless donation
        """
        st.success("✨ Gasless donation initiated!")
        st.info("""
        Your tokens will be collected when the batch reaches optimal size.
        You'll receive a notification when the donation is complete.
        No action needed from your side!
        """)
        
        # Show estimated timeline
        st.markdown("**Estimated Timeline:**")
        st.markdown("- Batch formation: 1-3 days")
        st.markdown("- Processing: Within 24 hours of batch completion")
        st.markdown("- You save: ~$2-5 in gas fees")
    
    def render_impact_chart(self):
        """
        Render impact visualization chart
        """
        import plotly.graph_objects as go
        
        # Mock data for demonstration
        dates = ["Week 1", "Week 2", "Week 3", "Week 4"]
        donations = [120, 245, 389, 512]
        gas_saved = [45, 89, 134, 198]
        
        fig = go.Figure()
        
        fig.add_trace(go.Bar(
            name='Donations ($)',
            x=dates,
            y=donations,
            marker_color='lightblue'
        ))
        
        fig.add_trace(go.Bar(
            name='Gas Saved ($)',
            x=dates,
            y=gas_saved,
            marker_color='lightgreen'
        ))
        
        fig.update_layout(
            title="Weekly Impact",
            barmode='group',
            height=300
        )
        
        st.plotly_chart(fig, use_container_width=True)
    
    def render_recent_donations(self):
        """
        Show recent donation activity
        """
        recent = [
            {"time": "2 hours ago", "amount": "$0.47", "tokens": "3 tokens", "donor": "0x...abc"},
            {"time": "5 hours ago", "amount": "$0.89", "tokens": "5 tokens", "donor": "0x...def"},
            {"time": "1 day ago", "amount": "$1.23", "tokens": "8 tokens", "donor": "0x...ghi"},
        ]
        
        for donation in recent:
            col1, col2, col3, col4 = st.columns([2, 2, 2, 2])
            
            with col1:
                st.text(donation['time'])
            with col2:
                st.text(donation['amount'])
            with col3:
                st.text(donation['tokens'])
            with col4:
                st.text(donation['donor'])


def render_dust_donation_widget(wallet_address: str):
    """
    Helper function to render the widget
    """
    widget = DustDonationWidget()
    widget.render(wallet_address)
