import { inAppWallet } from "thirdweb/wallets";
import { client } from "@/lib/thirdwebClient";

export const embeddedWallet = inAppWallet({
  client,   // ✅ REQUIRED for email login to work
  auth: {
    options: ["google", "email"],
  },
});
