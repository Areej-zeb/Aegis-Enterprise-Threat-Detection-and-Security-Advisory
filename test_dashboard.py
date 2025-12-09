#!/usr/bin/env python3
"""Test script to verify dashboard can load"""
import sys
import os

print("🔍 Testing AEGIS Dashboard...")
print(f"Python: {sys.version}")
print(f"Working directory: {os.getcwd()}")

# Test imports
print("\n📦 Testing imports...")
try:
    import streamlit as st
    print("✅ streamlit")
except Exception as e:
    print(f"❌ streamlit: {e}")
    sys.exit(1)

try:
    import pandas as pd
    print("✅ pandas")
except Exception as e:
    print(f"❌ pandas: {e}")
    sys.exit(1)

try:
    import numpy as np
    print("✅ numpy")
except Exception as e:
    print(f"❌ numpy: {e}")
    sys.exit(1)

try:
    import plotly
    print("✅ plotly")
except Exception as e:
    print(f"❌ plotly: {e}")
    sys.exit(1)

try:
    import joblib
    print("✅ joblib")
except Exception as e:
    print(f"❌ joblib: {e}")
    sys.exit(1)

# Test file existence
print("\n📁 Checking files...")
from pathlib import Path

files_to_check = [
    "artifacts/Syn/xgb_baseline.joblib",
    "artifacts/mitm_arp/xgb_baseline.joblib",
    "datasets/processed/Syn/test.parquet",
    "datasets/processed/mitm_arp/test.parquet",
    "frontend_streamlit/aegis_dashboard.py"
]

all_exist = True
for file_path in files_to_check:
    if Path(file_path).exists():
        print(f"✅ {file_path}")
    else:
        print(f"❌ {file_path} NOT FOUND")
        all_exist = False

if not all_exist:
    print("\n⚠️ Some files are missing. Dashboard may not work correctly.")
    sys.exit(1)

# Test dashboard import (without running streamlit)
print("\n🧪 Testing dashboard import...")
try:
    # Just check syntax, don't actually run
    import py_compile
    py_compile.compile('frontend_streamlit/aegis_dashboard.py', doraise=True)
    print("✅ Dashboard syntax OK")
except Exception as e:
    print(f"❌ Dashboard syntax error: {e}")
    sys.exit(1)

print("\n✅ All tests passed! Dashboard should work.")
print("\n🚀 To start dashboard:")
print("   python3 -m streamlit run frontend_streamlit/aegis_dashboard.py")
