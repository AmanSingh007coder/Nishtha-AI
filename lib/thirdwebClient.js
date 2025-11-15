import { createThirdwebClient } from "thirdweb";

// This is the client you'll use for all frontend operations
export const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID,
});