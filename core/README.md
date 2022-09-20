# Staking

### How to test cold-wallet and masternode manager communication

1. start cold-wallet with `npm run cw`
1. start masternode manager with `npm run mn`

#### TODO

Open another tcp server on masternode manager on port 9001. User can use `netcat` or `nc` (on MacOS) to connect to localhost 9001 and send operations as easy as possible
Example:

1. `nc localhost 9001`
1. `create-masternode` same as `Operation` enum value
