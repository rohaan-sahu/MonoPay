import { SimpleLineIcons } from '@expo/vector-icons';
import { encodeURL } from '@solana/pay';
import { PublicKey, Keypair } from '@solana/web3.js';
import BigNumber from 'bignumber.js';
const SENDER_PUBKEY = process.env.EXPO_PUBLIC_RECEIVER_PUBLIC_KEY;
const someLabel = "My Account"
const someMessage = "Order #123";

console.log("SEND",SENDER_PUBKEY);

// Simple URL. Just Address
interface SimpleUrlProp {
  recepient: PublicKey;
  label: string;
  message: string;
}


// NOT WORKING AS EXPECTED.  GIVING INCORRECT LINKS
export const url = encodeURL({
  recipient: new PublicKey(SENDER_PUBKEY!),
  //amount: new BigNumber(0.1),
  //reference: Keypair.generate().publicKey,
  label: 'My Store',
  message: 'Order #123',
});

export function simpleUrl({recepient,label,message}:SimpleUrlProp) {
  encodeURL({
    recipient: new PublicKey(recepient),
    label: label,
    message: message,
  })
}

// URL with Address & Amount

interface WithAmountUrlProp {
  recepient: PublicKey;
  amount: number;
  label: string;
  message: string;
}

export function wihAmountUrl({recepient,amount,label,message}:WithAmountUrlProp) {
  encodeURL({
    recipient: new PublicKey(recepient),
    amount: new BigNumber(amount),
    // reference: Keypair.generate().publicKey,
    label: 'My Store',
    message: 'Order #123',
  })
}