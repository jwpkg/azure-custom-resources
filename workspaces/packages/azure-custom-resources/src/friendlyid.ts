import bs58 from 'bs58';
import { createHash } from 'crypto';

import { Request } from './request';

export function generateFriendlyId(prefix: string, request: Request) {
  const hash = createHash('sha1');
  hash.update(request.subscriptionId);
  hash.update(request.resoureGroup);
  hash.update(request.providerType);
  hash.update(request.resourceType);
  hash.update(request.resourceName);
  const result = hash.digest().subarray(0, 7);
  return `${prefix}-${bs58.encode(result)}`;
}
