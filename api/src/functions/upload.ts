import {
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
  app
} from '@azure/functions';
import { uploadBlob } from '../lib/azure-storage';

export async function postUploadAnyFile(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log(`Http function processed request for url "${request.url}"`);

  const container = request.query.get('container') || 'upload';
  const file = request.query.get('file') || 'new-upload';

  const lastDotIndex = file.lastIndexOf('.');
    const fileName = lastDotIndex > 0 ? file.substring(0, lastDotIndex) : file;
    const fileExt = lastDotIndex > 0 ? file.substring(lastDotIndex + 1) : '';
    const newFileName = `${fileName}-${new Date().toISOString().substring(0, 10)}.${fileExt}`;
    const path = `${container}/${newFileName}`;
    context.log(path);
    
  // file content must be passed in body
  const formData = await request.formData();
  const temp: any = formData.get('file');
  const uploadedFile: File = temp as File;

  // File
  const fileContents = await uploadedFile.arrayBuffer();
  const fileContentsBuffer: Buffer = Buffer.from(fileContents);
  const size = fileContentsBuffer.byteLength;
  console.log(`lastModified = ${uploadedFile?.lastModified}, size = ${size}`);

  const sasTokenUrl = await uploadBlob(
    process.env?.Azure_Storage_AccountName as string,
    process.env?.Azure_Storage_AccountKey as string,
    file,
    container,
    fileContentsBuffer
  );

  return {
    jsonBody: {
      file,
      storageAccountName: process.env.Azure_Storage_AccountName,
      containername: container,
      sasTokenUrl
    }
  };
}

app.http('upload', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: postUploadAnyFile
});
