// Used to get read-only SAS token URL
import {
  BlobSASPermissions,
  BlobServiceClient,
  ContainerClient,
  SASProtocol,
  StorageSharedKeyCredential
} from '@azure/storage-blob';

function getBlobServiceClient(serviceName, serviceKey) {
  const sharedKeyCredential = new StorageSharedKeyCredential(
    serviceName,
    serviceKey
  );
  const blobServiceClient = new BlobServiceClient(
    `https://${serviceName}.blob.core.windows.net`,
    sharedKeyCredential
  );

  return blobServiceClient;
}

async function createContainer(
  containerName: string,
  blobServiceClient: BlobServiceClient
): Promise<ContainerClient> {
  const containerClient = blobServiceClient.getContainerClient(containerName);
  await containerClient.createIfNotExists();

  return containerClient;
}

export async function uploadBlob(
  serviceName: string,
  serviceKey: string,
  fileName: string,
  containerName: string,
  blob: Buffer
): Promise<string> {
  if (!serviceName || !serviceKey || !fileName || !containerName || !blob) {
    return 'Upload function missing parameters';
  }

  const blobServiceClient = getBlobServiceClient(serviceName, serviceKey);

  const containerClient = await createContainer(
    containerName,
    blobServiceClient
  );
  const blockBlobClient = await containerClient.getBlockBlobClient(fileName);
  await blockBlobClient.uploadData(blob);
  return await blockBlobClient.generateSasUrl({
    startsOn: new Date(),
    expiresOn: new Date(new Date().valueOf() + 60 * 60 * 1000),
    permissions: BlobSASPermissions.parse('r'), // Read only permission to the blob
    protocol: SASProtocol.Https // Only allow HTTPS access to the blob
  });
}

export const generateSASUrl = async (
  serviceName: string,
  serviceKey: string,
  containerName: string,
  fileName: string, // hierarchy of folders and file name: 'folder1/folder2/filename.ext'
  permissions = 'r', // default read only
  timerange = 1 // default 1 minute
): Promise<string> => {
  if (!serviceName || !serviceKey || !fileName || !containerName) {
    return 'Generate SAS function missing parameters';
  }

  const blobServiceClient = getBlobServiceClient(serviceName, serviceKey);
  const containerClient = await createContainer(
    containerName,
    blobServiceClient
  );
  const blockBlobClient = await containerClient.getBlockBlobClient(fileName);

  // Best practice: create time limits
  const SIXTY_MINUTES = timerange * 60 * 1000;
  const NOW = new Date();

  // Create SAS URL
  const accountSasTokenUrl = await blockBlobClient.generateSasUrl({
    startsOn: NOW,
    expiresOn: new Date(new Date().valueOf() + SIXTY_MINUTES),
    permissions: BlobSASPermissions.parse(permissions), // Read only permission to the blob
    protocol: SASProtocol.Https // Only allow HTTPS access to the blob
  });

  return accountSasTokenUrl;
};

type ListFilesInContainerResponse = {
  error: boolean;
  errorMessage: string;
  data: string[];
};

export const listFilesInContainer = async (
  serviceName: string,
  serviceKey: string,
  containerName: string
): Promise<ListFilesInContainerResponse> => {
  if (!serviceName || !serviceKey || !containerName) {
    return {
      error: true,
      errorMessage: 'List files in container function missing parameters',
      data: []
    };
  }

  const blobServiceClient = getBlobServiceClient(serviceName, serviceKey);
  const containerClient = blobServiceClient.getContainerClient(containerName);

  const data = [];

  for await (const response of containerClient
    .listBlobsFlat()
    .byPage({ maxPageSize: 20 })) {
    for (const blob of response.segment.blobItems) {
      const fileMeta = {
        DLLink: `<a href=${containerClient.url}/${blob.name}>Link</a>`,
        fileName: blob.name,
        createdOn: `${new Date(blob.properties.createdOn).toLocaleDateString()} - ${new Date(  blob.properties.createdOn).toLocaleTimeString()}`,
        lastModified: `${new Date(blob.properties.lastModified).toLocaleDateString()} - ${new Date(  blob.properties.lastModified).toLocaleTimeString()}`,
        size: blob.properties.contentLength,
        etag: blob.properties.etag
      };
      data.push(fileMeta);
      // data.push(`${containerClient.url}/${blob.name}`);
    }
  }

  return {
    error: false,
    errorMessage: '',
    data
  };
};
