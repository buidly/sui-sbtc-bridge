export const formatAddress = (address: string, size: number = 10) => {
  return address.slice(0, size) + "..." + address.slice(-size);
};
