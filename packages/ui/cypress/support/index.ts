import './commands';
import 'cypress-metamask';
import { resolve } from 'path';

import { loadEnvConfig } from '@next/env';
console.log(process.cwd());
const a = loadEnvConfig(process.cwd());
console.log(a);
