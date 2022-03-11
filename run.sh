#!/bin/bash

npx hardhat deploy --network mainbridge
npx hardhat deploy --network subbridge

npx hardhat regtoken --network mainbridge
npx hardhat regtoken --network subbridge

echo "===================================================================================================="
echo "Continue?"
read line

npx hardhat transfer --network mainbridge
sleep 5
npx hardhat bal --network subbridge
