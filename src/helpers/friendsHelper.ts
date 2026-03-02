
// address shortner
export const short = (s: string, n = 4) => `${s.slice(0, n)}...${s.slice(-n)}`;