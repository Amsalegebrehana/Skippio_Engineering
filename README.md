# This application receives payment confirmations, registers paid orders with a simulated point-of-sale system (POS)

There are three parts
1, Backend: A REST API that handles payment confirmations and order registration. using Node.js and TypeScript.
2, Frontend: a single page UI to submit payment events, look up orders, and retry failed POS syncs
3, POS Simulator: A mock local function (not a real server) that accepts orders and returns transaction references. It's designed to fail on the first attempt and succeed on retry


## Processing an order
1, Save the order as paid
2, Send it to POS
3, Allow retry it the POS fails
4, Prevent duplicate order, POS transactions and refunds.