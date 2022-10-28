import { BeefyPlugin, Reward, Strategy } from '@midas-capital/types';
import axios from 'axios';
import { functionsAlert } from '../../alert';
import { AbstractAPYProvider } from './AbstractAPYProvider';
interface BeefyAPYResponse {
  [key: string]: number;
}

class BeefyAPYProvider extends AbstractAPYProvider {
  static apyEndpoint = 'https://api.beefy.finance/apy';
  private beefyAPYs: BeefyAPYResponse | undefined;

  async init() {
    this.beefyAPYs = await (await axios.get(BeefyAPYProvider.apyEndpoint)).data;
    if (!this.beefyAPYs) {
      throw `BeefyAPYProvider: unexpected Beefy APY response`;
    }
  }

  async getApy(pluginAddress: string, pluginData: BeefyPlugin): Promise<Reward[]> {
    if (pluginData.strategy != Strategy.Beefy)
      throw `BeefyAPYProvider: Not a Beefy Plugin ${pluginAddress}`;

    if (!pluginData.apyDocsUrl) throw 'BeefyAPYProvider: `apyDocsUrl` is required to map Beefy APY';

    const beefyID = pluginData.apyDocsUrl.split('/').pop();
    if (!beefyID) throw 'BeefyAPYProvider: unable to extract `Beefy ID` from `apyDocsUrl`';

    if (!this.beefyAPYs) {
      throw 'BeefyAPYProvider: Not initialized';
    }

    const apy = this.beefyAPYs![beefyID];
    if (apy === undefined) {
      await functionsAlert(
        `BeefyAPYProvider: ${beefyID}`,
        `Beefy ID: "${beefyID}" not included in Beefy APY data`
      );
      throw `Beefy ID: "${beefyID}" not included in Beefy APY data`;
    }

    if (apy === 0) {
      await functionsAlert(`BeefyAPYProvider: ${pluginAddress}`, 'External APY of Plugin is 0');
    }

    return [{ apy, updated_at: new Date().toISOString() }];
  }
}

export default new BeefyAPYProvider();
