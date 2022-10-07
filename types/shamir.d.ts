declare module 'shamir' {
  function split(
    random: (size: number) => Buffer,
    shares: number,
    threshold: number,
    secret: Buffer,
  ): { [key: string]: Uint8Array };
  function join(parts: { [key: string]: Buffer }): Uint8Array;
}
