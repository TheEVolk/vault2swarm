import Docker from 'dockerode';
import { getSecret } from './vault.js';

const INTERVAL = parseInt(process.env.INTERVAL || '60') * 1e3;
const DOCKER_OPTIONS = process.env.DOCKER_OPTIONS || {};
const docker = new Docker(DOCKER_OPTIONS);

/**
 * @param {string} labelKey 
 * @param {string} labelValue 
 */
async function parseLabel(labelKey, labelValue) {
  const [, secret, secretKey] = labelKey.split(':');

  let type = 'env';
  if (labelValue.startsWith('env:')) {
    type = 'env';
    labelValue = labelValue.substring(4);
  }

  if (labelValue.startsWith('env:')) {
    type = 'secret';
    throw new Error('secret type not support');
  }

  return {
    secret,
    type,
    key: labelValue,
    value: await getSecret(secret).then((response) => response[secretKey]),
  };
}

/**
 * @param {Docker.Service} service 
 */
async function processService(service) {
  const suitableLabels = [];
  for (const [key, value] of Object.entries(service.Spec.Labels)) {
    if (!key.startsWith('vault2swarm:')) {
      continue;
    }

    const parsed = await parseLabel(key, value);
    suitableLabels.push(parsed);
  }

  if (!suitableLabels.length) {
    return;
  }

  console.log('Found labels for service ' + service.Spec.Name);

  const _service = await docker.getService(service.ID);

  const oldEnvs = Object.fromEntries(service.Spec.TaskTemplate.ContainerSpec.Env.map((v) => v.split('=')));
  const newEnvs = {
    ...oldEnvs,
    ...Object.fromEntries(suitableLabels.map((v) => [v.key, v.value])),
  };

  if (JSON.stringify(oldEnvs) === JSON.stringify(newEnvs)) {
    console.log('no changes.');
    return;
  }

  service.Spec.TaskTemplate.ContainerSpec.Env = Object.entries(newEnvs).map(([k, v]) => `${k}=${v}`);

  await _service.update({
    version: service.Version.Index,
    ...service.Spec,
  });
}

async function processServices() {
  const services = await docker.listServices();

  for (const service of services) {
    await processService(service);
  }

  clearSecrets();
}

async function run() {
  const { Version } = await docker.version();
  console.log(`Connected to docker (v${Version})`);

  // TODO: make events instead of timer
  // const eventStream = await docker.getEvents();
  // eventStream.pipe(JSONStream.parse())
  //  .on('data', event => handleEvent(event).catch(handleError))
  //  .on('error', handleError);

  setInterval(() => processServices().catch(console.error), INTERVAL);
  processServices().catch(console.error);
}

run();