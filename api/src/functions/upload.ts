import {
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
  app
} from '@azure/functions';
import { uploadBlob } from '../lib/azure-storage';

const accountName = process.env?.Azure_Storage_AccountName;
const accessKey = process.env?.Azure_Storage_AccountKey;

function getFileName(file: File) {
  const lastDotIndex = file.name.lastIndexOf('.');
  const fileName = lastDotIndex > 0 ? file.name.substring(0, lastDotIndex) : file.name;
  const fileExt = lastDotIndex > 0 ? file.name.substring(lastDotIndex + 1) : '';
  return `${fileName}-${new Date().toISOString().substring(0, 10)}.${fileExt}`;
}

export async function postUploadAnyFile(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log(`Http function processed request for url "${request.url}"`);

  const container = request.query.get('container') || 'upload';
  const formData = await request.formData();
  const uploadedFile = formData.get('file');

  if (!uploadedFile) {
    return {
      status: 405,
      jsonBody: 'File Tranmission Error'
    };
  }
  const fileName = getFileName(uploadedFile as File);
  const fileContents = await uploadedFile.arrayBuffer();
  const fileContentsBuffer: Buffer = Buffer.from(fileContents);
  const size = fileContentsBuffer.byteLength;
  context.log(`lastModified = ${uploadedFile?.lastModified}, size = ${size}`);

  try {
  const sasTokenUrl = await uploadBlob(
    accountName as string,
    accessKey as string,
    fileName,
    container,
    fileContentsBuffer
  );
  return {
    jsonBody: {
      file: fileName,
      storageAccountName: accountName,
      containername: container,
      sasTokenUrl
    }
  };
  } catch (error) {
    return {
      status: 500,
      jsonBody: error
    };
  }
}

app.http('upload', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: postUploadAnyFile
});
