// app/api/mint-nft/route.js
import { NextResponse } from 'next/server';
import { createThirdwebClient, getContract } from "thirdweb";
import { sepolia } from "thirdweb/chains";

// 1. We import all the v5 tools we need from their *correct* paths
import { mintTo, totalSupply } from "thirdweb/extensions/erc721";
import { privateKeyToAccount } from "thirdweb/wallets"; // <-- This is the correct v5 import
import { sendTransaction, waitForReceipt } from "thirdweb/transaction";

// 2. We create the client *outside* the function for performance
const client = createThirdwebClient({
  secretKey: process.env.THIRDWEB_SECRET_KEY,
});

// 3. We create the "Server Wallet" account *outside* the function
// This uses the key from your MetaMask wallet
const account = privateKeyToAccount({
  client,
  privateKey: process.env.THIRDWEB_PRIVATE_KEY,
});

export async function POST(request) {
  const body = await request.json();
  const { userWalletAddress, projectName, courseName } = body;

  if (!userWalletAddress || !projectName || !courseName) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // 4. Check for our 3 critical keys
  if (!process.env.THIRDWEB_SECRET_KEY || !process.env.NEXT_PUBLIC_THIRDWEB_CONTRACT_ADDRESS || !process.env.THIRDWEB_PRIVATE_KEY) {
    console.error("Missing Thirdweb environment variables in .env.local");
    return NextResponse.json({ error: 'Server is not configured for minting.' }, { status: 500 });
  }

  try {
    // 5. Get the contract (v5 syntax)
    const contract = getContract({
      client,
      chain: sepolia, // We specify the chain here
      address: process.env.NEXT_PUBLIC_THIRDWEB_CONTRACT_ADDRESS,
    });

    // 6. Define the NFT metadata
    const metadata = {
      name: `Verified Skill: ${projectName}`,
      description: `This developer successfully completed the ${projectName} project for the course "${courseName}", as verified by Nishtha AI.`,
      image: "https://i.imgur.com/L13s80m.png", 
    };

    // 7. PREPARE the transaction
    const transaction = mintTo({
      contract,
      to: userWalletAddress,
      nft: metadata,
    });
    
    // 8. SIGN & SEND the transaction using our server wallet
    const { transactionHash } = await sendTransaction({
      transaction,
      account,
    });

    // 9. WAIT for the transaction to be mined
    await waitForReceipt({
      client,
      chain: sepolia,
      transactionHash: transactionHash,
    });

    // 10. NOW, we are 100% safe to get the total supply
    const count = await totalSupply({ contract });
    
    // 11. The tokenId is the (new total supply - 1)
    const lastTokenId = count - 1n; // 1n is "BigInt" for the number 1

    // 12. Return the FULL success response
    return NextResponse.json({ 
      success: true, 
      transactionHash: transactionHash,
      tokenId: lastTokenId.toString(),
      message: `NFT (ID: ${lastTokenId.toString()}) minted successfully to ${userWalletAddress}`,
    });

  } catch (error) {
    console.error("Blockchain Error:", error);
    return NextResponse.json({ 
      error: `Failed to mint NFT: ${error.message}`,
      details: error.toString() 
    }, { status: 500 });
  }
}