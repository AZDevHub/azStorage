import {
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
  app
} from '@azure/functions';
import { generateSASUrl } from '../lib/azure-storage.js';

const accountName = process.env?.Azure_Storage_AccountName;
const accessKey = process.env?.Azure_Storage_AccountKey;

export async function getGenerateSasToken(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log(`Http function processed request for url "${request.url}"`);

    if (!accountName || !accessKey) {
      return {
        status: 405,
        jsonBody: 'Missing required app configuration'
      };
    }
    const containerName = request.query.get('container') || 'anonymous';
    const fileName = request.query.get('file') || 'nonamefile';
    const permissions = request.query.get('permission') || 'w';
    const timerange = parseInt(request.query.get('timerange') || '10'); // 10 minutes

    context.log(`containerName: ${containerName}`);
    context.log(`fileName: ${fileName}`);
    context.log(`permissions: ${permissions}`);
    context.log(`timerange: ${timerange}`);
try {
    const url = await generateSASUrl(
      accountName,
      accessKey,
      containerName,
      fileName,
      permissions
    );

    return {
      jsonBody: {
        url
      }
    };
  } catch (error) {
    return {
      status: 500,
      jsonBody: error
    };
  }
}

app.http('sas', {
  methods: ['POST', 'GET'],
  authLevel: 'anonymous',
  handler: getGenerateSasToken
});
