import { ethers } from 'ethers';

import { optimizeAllocation } from '../src';

const cTokens = [
  '0x92897f3De21E2FFa8dd8b3a48D1Edf29B5fCef0e',
  '0x133bFF9D12C04C63a5A384417033a95Fae96Ac9e',
  '0x059c595f19d6FA9f8203F3731DF54455cD248c44',
  '0x57a64a77f8E4cFbFDcd22D5551F52D675cc5A956',
];

(async function () {
  await optimizeAllocation(cTokens, ethers.utils.parseEther('150'));
})();
