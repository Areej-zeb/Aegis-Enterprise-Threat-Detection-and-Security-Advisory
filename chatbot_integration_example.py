"""
chatbot_integration_example.py

Complete example showing how to integrate your alert_stream.py with Aegis IDS
for real-time security chatbot functionality.
"""

import asyncio
import logging
from typing import Dict, Any
from datetime import datetime

# Import your exact alert_stream module
from alert_stream import start_alert_stream
from aegis_alert_bridge import start_aegis_integrated_stream

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============================================================================
# CHATBOT RAG INTEGRATION EXAMPLE
# ============================================================================

class SecurityChatbotRAG:
    """
    Example RAG system for security chatbot.
    Replace this with your actual RAG implementation.
    """
    
    def __init__(self):
        self.alert_history = []
        self.threat_context = {}
        logger.info("SecurityChatbotRAG initialized")
    
    async def process_security_alert(self, alert: Dict[str, Any]) -> None:
        """
        Process a security alert for RAG integration.
        
        Args:
            alert: Formatted alert from alert_stream.py
        """
        try:
            # Store alert in history
            self.alert_history.append(alert)
            
            # Update threat context
            attack_type = alert['label']
            if attack_type not in self.threat_context:
                self.threat_context[attack_type] = {
                    'count': 0,
                    'last_seen': None,
                    'severity_levels': [],
                    'source_ips': set(),
                    'target_ips': set()
                }
            
            context = self.threat_context[attack_type]
            context['count'] += 1
            context['last_seen'] = alert['timestamp']
            context['severity_levels'].append(alert['severity'])
            context['source_ips'].add(alert['src_ip'])
            context['target_ips'].add(alert['dst_ip'])
            
            # Generate contextual insights
            insights = await self._generate_threat_insights(alert)
            
            # Log for demonstration
            logger.info(f"RAG: Processed {attack_type} alert from {alert['src_ip']}")
            logger.info(f"RAG: Generated {len(insights)} contextual insights")
            
            # Here you would:
            # 1. Store in vector database for semantic search
            # 2. Update knowledge graph
            # 3. Trigger automated responses
            # 4. Prepare context for chatbot queries
            
        except Exception as e:
            logger.error(f"Error processing alert in RAG: {e}")
    
    async def _generate_threat_insights(self, alert: Dict[str, Any]) -> list:
        """Generate contextual insights from the alert."""
        insights = []
        
        attack_type = alert['label']
        severity = alert['severity']
        confidence = alert['score']
        
        # Severity-based insights
        if severity == 'high' and confidence > 0.9:
            insights.append("High-confidence critical threat detected - immediate response recommended")
        
        # Attack pattern insights
        if attack_type == 'syn_flood':
            insights.append("SYN flood detected - potential DDoS attack in progress")
            insights.append("Monitor server resources and connection pools")
        elif attack_type == 'mitm':
            insights.append("Man-in-the-middle attack detected - network compromise possible")
            insights.append("Check for ARP spoofing and unauthorized network access")
        elif attack_type == 'dns_tunnel':
            insights.append("DNS tunneling detected - possible data exfiltration")
            insights.append("Monitor DNS queries for unusual patterns")
        
        # Feature-based insights
        top_features = alert.get('top_features', [])
        for feature in top_features[:2]:  # Top 2 features
            if feature['contrib'] > 0.3:
                insights.append(f"High contribution from {feature['name']} indicates {self._interpret_feature(feature['name'])}")
        
        return insights
    
    def _interpret_feature(self, feature_name: str) -> str:
        """Interpret what a high-contributing feature means."""
        interpretations = {
            'pkt_rate': 'abnormally high packet transmission rate',
            'SYN Flag Count': 'excessive SYN packet generation',
            'Flow Duration': 'unusual connection duration patterns',
            'payload_entropy': 'encrypted or obfuscated data transmission',
            'connection_rate': 'rapid connection establishment attempts',
            'tcp_flags_ratio': 'abnormal TCP flag combinations'
        }
        return interpretations.get(feature_name, 'unusual network behavior')
    
    async def get_threat_summary(self) -> Dict[str, Any]:
        """Get current threat landscape summary for chatbot context."""
        total_alerts = len(self.alert_history)
        
        if total_alerts == 0:
            return {"status": "No recent threats detected"}
        
        # Recent alerts (last 10)
        recent_alerts = self.alert_history[-10:]
        
        # Threat type distribution
        threat_types = {}
        severity_counts = {'low': 0, 'medium': 0, 'high': 0}
        
        for alert in recent_alerts:
            attack_type = alert['label_human']
            threat_types[attack_type] = threat_types.get(attack_type, 0) + 1
            severity_counts[alert['severity']] += 1
        
        return {
            "total_alerts": total_alerts,
            "recent_alerts_count": len(recent_alerts),
            "threat_types": threat_types,
            "severity_distribution": severity_counts,
            "most_common_threat": max(threat_types.items(), key=lambda x: x[1])[0] if threat_types else None,
            "last_alert_time": recent_alerts[-1]['timestamp'] if recent_alerts else None
        }

# ============================================================================
# CHATBOT CALLBACK FUNCTIONS
# ============================================================================

# Initialize RAG system
chatbot_rag = SecurityChatbotRAG()

async def chatbot_alert_processor(alert: Dict[str, Any]) -> None:
    """
    Main callback function for processing alerts in your chatbot.
    This function receives alerts in your exact alert_stream.py format.
    
    Args:
        alert: Formatted alert dictionary from alert_stream.py
    """
    try:
        # Log the alert
        logger.info(f"🤖 Processing alert: {alert['id']} - {alert['label_human']}")
        
        # Process through RAG system
        await chatbot_rag.process_security_alert(alert)
        
        # Display formatted alert (for demonstration)
        await display_alert_for_chatbot(alert)
        
        # Here you would integrate with your actual chatbot:
        # await chatbot.add_security_context(alert)
        # await chatbot.trigger_security_response(alert)
        # await notification_system.send_alert(alert)
        
    except Exception as e:
        logger.error(f"Error in chatbot alert processor: {e}")

async def display_alert_for_chatbot(alert: Dict[str, Any]) -> None:
    """Display alert in a chatbot-friendly format."""
    print(f"\n🚨 SECURITY ALERT 🚨")
    print(f"Type: {alert['label_human']}")
    print(f"Severity: {alert['severity'].upper()}")
    print(f"Confidence: {alert['score']:.1%}")
    print(f"Source: {alert['src_ip']}:{alert['src_port']}")
    print(f"Target: {alert['dst_ip']}:{alert['dst_port']}")
    print(f"Protocol: {alert['protocol']}")
    
    if alert.get('top_features'):
        print(f"Key Indicators:")
        for feature in alert['top_features'][:3]:
            print(f"  • {feature['name']}: {feature['contrib']:+.3f}")
    
    print(f"Time: {alert['timestamp']}")
    print("-" * 50)

# ============================================================================
# MAIN INTEGRATION FUNCTIONS
# ============================================================================

async def run_with_aegis_integration():
    """
    Run the chatbot with live Aegis IDS integration.
    This connects to the real Aegis WebSocket and processes live detections.
    """
    logger.info("Starting chatbot with Aegis IDS integration...")
    
    try:
        await start_aegis_integrated_stream(
            callback=chatbot_alert_processor,
            mode="live",
            aegis_ws_url="ws://localhost:8000/ws/detection/live"
        )
    except Exception as e:
        logger.error(f"Error in Aegis integration: {e}")
        raise

async def run_with_demo_mode():
    """
    Run the chatbot with demo alerts for testing.
    This generates synthetic alerts using your alert_stream.py demo mode.
    """
    logger.info("Starting chatbot with demo alerts...")
    
    try:
        await start_alert_stream(
            callback=chatbot_alert_processor,
            mode="demo"
        )
    except Exception as e:
        logger.error(f"Error in demo mode: {e}")
        raise

async def run_with_static_mode():
    """
    Run the chatbot with static alerts from file.
    This replays alerts from a JSON file for testing.
    """
    logger.info("Starting chatbot with static alerts...")
    
    try:
        await start_alert_stream(
            callback=chatbot_alert_processor,
            mode="static"
        )
    except Exception as e:
        logger.error(f"Error in static mode: {e}")
        raise

# ============================================================================
# FASTAPI INTEGRATION EXAMPLE
# ============================================================================

async def setup_fastapi_integration():
    """
    Example of how to integrate with FastAPI for a web-based chatbot.
    """
    # This would be in your FastAPI startup event
    
    # Start the alert stream as a background task
    asyncio.create_task(start_aegis_integrated_stream(
        callback=chatbot_alert_processor,
        mode="live"
    ))
    
    logger.info("FastAPI integration setup complete")

# ============================================================================
# MAIN EXECUTION
# ============================================================================

async def main():
    """
    Main function demonstrating different integration modes.
    """
    import sys
    
    # Parse command line arguments
    mode = "demo"  # Default
    if len(sys.argv) > 1:
        mode = sys.argv[1].lower()
    
    print(f"""
╔══════════════════════════════════════════════════════════════════╗
║              AEGIS IDS - Chatbot Integration                    ║
║                                                                  ║
║  Mode: {mode.upper().center(56)}║
║                                                                  ║
║  This example shows how to integrate your alert_stream.py       ║
║  with Aegis IDS for real-time security chatbot functionality.  ║
║                                                                  ║
║  Press Ctrl+C to stop                                           ║
╚══════════════════════════════════════════════════════════════════╝
    """)
    
    try:
        if mode == "live":
            await run_with_aegis_integration()
        elif mode == "demo":
            await run_with_demo_mode()
        elif mode == "static":
            await run_with_static_mode()
        else:
            print(f"Unknown mode: {mode}")
            print("Available modes: live, demo, static")
            return
            
    except KeyboardInterrupt:
        print("\n\nChatbot integration stopped.")
        
        # Display final threat summary
        summary = await chatbot_rag.get_threat_summary()
        print("\n📊 THREAT SUMMARY:")
        for key, value in summary.items():
            print(f"  {key}: {value}")
        
        print("\nGoodbye! 👋")

if __name__ == "__main__":
    """
    Usage examples:
    
    # Connect to live Aegis IDS
    python chatbot_integration_example.py live
    
    # Use demo mode for testing
    python chatbot_integration_example.py demo
    
    # Use static file replay
    python chatbot_integration_example.py static
    """
    asyncio.run(main())