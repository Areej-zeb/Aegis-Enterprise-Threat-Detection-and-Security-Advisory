"""
Threat Intelligence Module Setup
Initialize the threat intelligence system with seed data.
"""

from pathlib import Path
from .database import get_db
from .threat_generator import ThreatGenerator


def initialize_threat_intel():
    """Initialize threat intelligence system"""
    print("\n" + "="*70)
    print("🔍 INITIALIZING THREAT INTELLIGENCE MODULE")
    print("="*70)
    
    # Get database instance
    db = get_db()
    print("✅ Database initialized")
    
    # Generate initial incidents
    print("\n📊 Generating initial threat data...")
    generator = ThreatGenerator()
    
    # Generate 100 initial incidents
    for i in range(100):
        incident = generator.generate_incident()
        db.add_incident(incident)
        if (i + 1) % 20 == 0:
            print(f"   Generated {i + 1} incidents...")
    
    print(f"✅ Generated 100 initial incidents")
    
    # Print summary
    summary = db.get_summary()
    print("\n📈 Threat Summary:")
    print(f"   Total Incidents: {summary.total_incidents}")
    print(f"   Critical: {summary.critical}")
    print(f"   High: {summary.high}")
    print(f"   Medium: {summary.medium}")
    print(f"   Low: {summary.low}")
    
    # Print attack distribution
    distribution = db.get_attack_distribution()
    print("\n🎯 Attack Distribution:")
    for attack in distribution:
        print(f"   {attack.type}: {attack.count} ({attack.percentage:.1f}%)")
    
    # Print threat actors
    actors = db.get_top_threat_actors(limit=5)
    print("\n👥 Top Threat Actors:")
    for actor in actors:
        incidents = [i for i in db.get_recent_incidents(limit=1000) if i.threat_actor == actor.id]
        print(f"   {actor.name}: {len(incidents)} incidents")
    
    print("\n" + "="*70)
    print("✅ THREAT INTELLIGENCE MODULE READY")
    print("="*70 + "\n")


if __name__ == "__main__":
    initialize_threat_intel()
