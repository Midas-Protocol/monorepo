import { BigNumber, providers } from "ethers";
import { task, types } from "hardhat/config";

export default task("send-tokens", "send tokens")
  .addParam("tokens", "Comma-separated symbols")
  .addParam("sendFrom", "Account to send from", undefined, types.string)
  .addParam("sendTo", "Address to which the minted tokens should be sent to", undefined, types.string)
  .addOptionalParam("sendAmount", "Amount to be sent", "10", types.string)
  .setAction(async ({ tokens: _tokens, sendTo: _sendTo, sendAmount: _sendAmount, sendFrom: _sendFrom }, { ethers }) => {
    const tokens = _tokens.split(",");
    let tx: providers.TransactionResponse;
    for (const tokenName of tokens) {
      const token = await ethers.getContract(`${tokenName}Token`, await ethers.getSigner(_sendFrom));
      tx = await token.transfer(_sendTo, BigNumber.from(_sendAmount).mul(BigNumber.from(10).pow(18)));
      console.log(await tx.wait());
      const balance = await token.balanceOf(_sendFrom);
      console.log(balance.toString());
    }
  });
