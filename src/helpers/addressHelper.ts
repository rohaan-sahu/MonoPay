
// address shortner
export const short = (s: string, n = 4) => `${s.slice(0, n)}...${s.slice(-n)}`;
// short(address.trim(), 6)

// address trimmer
export const trimAddr = (address: string) => address.trim();