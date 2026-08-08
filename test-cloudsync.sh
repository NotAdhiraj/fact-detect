#!/bin/bash

# Test script for CloudSync Pro doc verification
# This tests the stricter entity matching and 429 retry logic

BASE_URL="http://localhost:3000"

echo "=== Step 1: Create CloudSync Pro doc ==="
DOC_RESPONSE=$(curl -s -X POST "$BASE_URL/api/docs" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "CloudSync Pro Product Documentation",
    "content": "CloudSync Pro is a cloud storage platform with the following features:\n- 5TB storage capacity\n- End-to-end encryption\n- Real-time collaboration\n- iOS and Android apps available\n- SOC 2 Type II compliant\n- API rate limit: 10,000 requests per minute\n- Founded in 2019 by TechStart Inc.\n- Pricing: $29/month for Pro tier\n- Supports up to 100 concurrent users per workspace"
  }')

echo "Doc response: $DOC_RESPONSE"
DOC_ID=$(echo "$DOC_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

if [ -z "$DOC_ID" ]; then
  echo "Failed to create doc"
  exit 1
fi

echo "Created doc: $DOC_ID"
sleep 2

echo -e "\n=== Step 2: Extract claims ==="
EXTRACT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/extract" \
  -H "Content-Type: application/json" \
  -d "{\"docId\": \"$DOC_ID\"}")

echo "Extract response: $EXTRACT_RESPONSE"

# Extract claim IDs
CLAIM_IDS=$(echo "$EXTRACT_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
CLAIM_COUNT=$(echo "$CLAIM_IDS" | wc -l | tr -d ' ')

echo "Extracted $CLAIM_COUNT claims"
sleep 2

echo -e "\n=== Step 3: Verify each claim (testing 429 retry and entity matching) ==="
CLAIM_NUM=0
ERROR_COUNT=0
RATE_LIMIT_RETRIES=0

for CLAIM_ID in $CLAIM_IDS; do
  CLAIM_NUM=$((CLAIM_NUM + 1))
  echo -e "\n--- Verifying claim $CLAIM_NUM/$CLAIM_COUNT (ID: $CLAIM_ID) ---"
  
  # Get the claim text first
  CLAIM_TEXT=$(curl -s "$BASE_URL/api/claims?docId=$DOC_ID" | grep -o "\"id\":\"$CLAIM_ID\"[^}]*\"claim_text\":\"[^\"]*\"" | sed 's/.*"claim_text":"//;s/"$//' | head -1)
  echo "Claim: $CLAIM_TEXT"
  
  # Verify the claim
  VERIFY_RESPONSE=$(curl -s -X POST "$BASE_URL/api/verify" \
    -H "Content-Type: application/json" \
    -d "{\"claimId\": \"$CLAIM_ID\"}")
  
  echo "Response: $VERIFY_RESPONSE"
  
  # Check if there's an error
  if echo "$VERIFY_RESPONSE" | grep -q '"status":"error"'; then
    ERROR_COUNT=$((ERROR_COUNT + 1))
    echo "⚠️  ERROR status detected!"
  fi
  
  # Check for rate limit retry in logs (we'll look for the pattern)
  if echo "$VERIFY_RESPONSE" | grep -qi "rate\|429"; then
    RATE_LIMIT_RETRIES=$((RATE_LIMIT_RETRIES + 1))
    echo "🔄 Rate limit retry detected"
  fi
  
  # Add delay between requests to avoid rate limits
  sleep 3
done

echo -e "\n=== Step 4: Get final status of all claims ==="
FINAL_CLAIMS=$(curl -s "$BASE_URL/api/claims?docId=$DOC_ID")
echo "Final claims status:"
echo "$FINAL_CLAIMS" | python3 -c "
import json, sys
data = json.load(sys.stdin)
claims = data.get('claims', [])
for i, claim in enumerate(claims, 1):
    status = claim.get('status', 'unknown')
    reasoning = claim.get('reasoning', 'N/A')
    print(f'{i}. [{status}] {claim[\"claim_text\"][:60]}...' if len(claim['claim_text']) > 60 else f'{i}. [{status}] {claim[\"claim_text\"]}')
    if reasoning and reasoning != 'N/A':
        print(f'   Reasoning: {reasoning[:100]}...' if len(reasoning) > 100 else f'   Reasoning: {reasoning}')
"

echo -e "\n=== Summary ==="
echo "Total claims: $CLAIM_COUNT"
echo "Errors encountered: $ERROR_COUNT"
echo "Rate limit retries: $RATE_LIMIT_RETRIES"

# Count final statuses
CONFIRMED=$(echo "$FINAL_CLAIMS" | grep -o '"status":"confirmed"' | wc -l | tr -d ' ')
STALE=$(echo "$FINAL_CLAIMS" | grep -o '"status":"stale"' | wc -l | tr -d ' ')
UNVERIFIABLE=$(echo "$FINAL_CLAIMS" | grep -o '"status":"unverifiable"' | wc -l | tr -d ' ')
ERROR_STATUS=$(echo "$FINAL_CLAIMS" | grep -o '"status":"error"' | wc -l | tr -d ' ')

echo "Confirmed: $CONFIRMED"
echo "Stale: $STALE"
echo "Unverifiable: $UNVERIFIABLE"
echo "Error: $ERROR_STATUS"

if [ "$ERROR_STATUS" -gt 0 ]; then
  echo -e "\n❌ Some claims have error status - check logs"
  exit 1
else
  echo -e "\n✅ All claims resolved without errors"
  exit 0
fi
