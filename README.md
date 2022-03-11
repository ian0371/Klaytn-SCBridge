# Klaytn ServiceChain Token Bridge

This project ports service chain token test/deploy to hardhat.
Customize `url`, `chainId`, `operator` in `hardhat.config.js` as follows:

```
mainbridge: {
  url: "http://127.0.0.1:8554",
  chainId: 1000,
      ...
  operator: '0x9388349e71140c1f099ca8293892ab0d1e151d4f',
},
subbridge: {
  url: "http://127.0.0.1:8555",
  chainId: 1001,
      ...
  operator: '0xcb5e2874276d3a96ab6331cafeb80baa6453eeb0',
},
```

Then, run `./run.sh`.
You need to run the output of the program before continuing.
