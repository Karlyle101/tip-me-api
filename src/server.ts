import { buildApp } from './app';
import { config } from './config';

const app = buildApp();
app.listen(config.port, () => {
  console.log(`Tip Me API listening on port ${config.port}`);
});
