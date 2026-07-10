#!/bin/bash
set -e

TARGET_HOST=${1:-"http://localhost:3000"}
SITEMAP_FILE="build/sitemap.xml"

if [ ! -f "$SITEMAP_FILE" ]; then
  echo "Error: $SITEMAP_FILE not found. Make sure to build the site first."
  exit 1
fi

echo "Extracting URLs from $SITEMAP_FILE..."
# <loc>http://.../path</loc> から URL を抽出
# Docusaurus の設定した baseUrl や url に基づいて出力されているため、TARGET_HOST に差し替える
URLS=$(grep -oP '<loc>\K[^<]+' "$SITEMAP_FILE")

if [ -z "$URLS" ]; then
  echo "No URLs found in sitemap."
  exit 1
fi

FAILED=0
SUCCESS=0

echo "Starting curl tests against $TARGET_HOST..."
for url in $URLS; do
  path=$(echo "$url" | sed -e 's|^[^/]*//[^/]*||')
  test_url="${TARGET_HOST}${path}"
  
  echo -n "Testing $test_url ... "
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$test_url" || echo "000")
  
  if [ "$STATUS" = "200" ]; then
    echo "OK (200)"
    SUCCESS=$((SUCCESS + 1))
  else
    echo "FAILED ($STATUS)"
    FAILED=$((FAILED + 1))
  fi
done

echo "----------------------------------------"
echo "Test Summary:"
echo "Success: $SUCCESS"
echo "Failed: $FAILED"
echo "----------------------------------------"

if [ $FAILED -gt 0 ]; then
  exit 1
fi
