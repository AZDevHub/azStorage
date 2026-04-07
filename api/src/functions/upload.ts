import {
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
  app
} from '@azure/functions';
import { uploadBlob } from '../lib/azure-storage';

function getFileName(file: File) {
  const lastDotIndex = file.name.lastIndexOf('.');
  const fileName = lastDotIndex > 0 ? file.name.substring(0, lastDotIndex) : file.name;
  const fileExt = lastDotIndex > 0 ? file.name.substring(lastDotIndex + 1) : '';
  return `${fileName}-${new Date().toISOString().replace(/[-:TZ.]/g, '')}.${fileExt}`;
}
const accountName = process.env?.Azure_Storage_AccountName;
const accessKey = process.env?.Azure_Storage_AccountKey;


export async function postUploadAnyFile(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log(`Http function processed request for url "${request.url}"`);

  const container = request.query.get('container') || 'upload';

  const formData = await request.formData();
  const temp: any = formData.get('file');
  const uploadedFile: File = temp as File;

  const fileName = getFileName(uploadedFile);

  // File
  const fileContents = await uploadedFile.arrayBuffer();
  const fileContentsBuffer: Buffer = Buffer.from(fileContents);
  const size = fileContentsBuffer.byteLength;
  console.log(`lastModified = ${uploadedFile?.lastModified}, size = ${size}`);

  const sasTokenUrl = await uploadBlob( accountName, accessKey, fileName, container, fileContentsBuffer);

  return {jsonBody: {sasTokenUrl}}
};

app.http('upload', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: postUploadAnyFile
});
