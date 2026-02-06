#!/bin/bash
cd /mnt/c/Users/Mustafa/Desktop/Aegis-Enterprise-Threat-Detection-and-Security-Advisory-main/datasets/raw/CIC-Bell-DNS-EXF-2021

echo "=== STATEFUL FILES ==="
echo ""
echo "Attack_heavy_Benign/Attacks:"
wc -l Attack_heavy_Benign/Attacks/stateful_features-*.csv | tail -1

echo ""
echo "Attack_heavy_Benign/Benign:"
wc -l Attack_heavy_Benign/Benign/stateful_features-*.csv | tail -1

echo ""
echo "Attack_Light_Benign/Attacks:"
wc -l Attack_Light_Benign/Attacks/stateful_features-*.csv | tail -1

echo ""
echo "Attack_Light_Benign/Benign:"
wc -l Attack_Light_Benign/Benign/stateful_features-*.csv | tail -1

echo ""
echo "Benign:"
wc -l Benign/stateful_features-*.csv | tail -1

echo ""
echo "=== STATELESS FILES ==="
echo ""
echo "Attack_heavy_Benign/Attacks:"
wc -l Attack_heavy_Benign/Attacks/stateless_features-*.csv | tail -1

echo ""
echo "Attack_heavy_Benign/Benign:"
wc -l Attack_heavy_Benign/Benign/stateless_features-*.csv | tail -1

echo ""
echo "Attack_Light_Benign/Attacks:"
wc -l Attack_Light_Benign/Attacks/stateless_features-*.csv | tail -1

echo ""
echo "Attack_Light_Benign/Benign:"
wc -l Attack_Light_Benign/Benign/stateless_features-*.csv | tail -1

echo ""
echo "Benign:"
wc -l Benign/stateless_features-*.csv | tail -1
