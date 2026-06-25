

import server from '../dist/server/server.js';

export default async function (request) {
  // Pass an empty env object and empty execution context
  return server.fetch(request, process.env, {});
}
