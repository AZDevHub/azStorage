// Used to get read-only SAS token URL
import {
  BlobSASPermissions,
  BlobServiceClient,
  ContainerClient,
  SASProtocol,
  StorageSharedKeyCredential
} from '@azure/storage-blob';

function getBlobServiceClient(storageAccountName, storageAccountKey) {
  const sharedKeyCredential = new StorageSharedKeyCredential(
    storageAccountName,
    storageAccountKey
  );
  const blobServiceClient = new BlobServiceClient(
    `https://${storageAccountName}.blob.core.windows.net`,
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
  storageAccountName: string,
  storageAccountKey: string,
  fileName: string,
  containerName: string,
  blob: Buffer
): Promise<string> {
  // eslint-disable-next-line prettier/prettier
  if (
    !storageAccountName ||
    !storageAccountKey ||
    !fileName ||
    !containerName ||
    !blob
  ) {
    return 'Upload function missing parameters';
  }

  // eslint-disable-next-line prettier/prettier
  const blobServiceClient = getBlobServiceClient(
    storageAccountName,
    storageAccountKey
  );

  const containerClient = await createContainer(
    containerName,
    blobServiceClient
  );
  const blockBlobClient = await containerClient.getBlockBlobClient(fileName);
  await blockBlobClient.uploadData(blob);

  const acountSasTokenUrl = await blockBlobClient.generateSasUrl({
    startsOn: new Date(),
    expiresOn: new Date(new Date().valueOf() + 60 * 60 * 1000),
    permissions: BlobSASPermissions.parse('r'),
    protocol: SASProtocol.HttpsAndHttp
  });

  return acountSasTokenUrl;
}

export const generateSASUrl = async (
  storageAccountName: string,
  storageAccountKey: string,
  containerName: string,
  fileName: string, // hierarchy of folders and file name: 'folder1/folder2/filename.ext'
  permissions = 'r', // default read only
  timerange = 1 // default 1 minute
): Promise<string> => {
  // eslint-disable-next-line prettier/prettier
  if (
    !storageAccountName ||
    !storageAccountKey ||
    !fileName ||
    !containerName
  ) {
    return 'Generate SAS function missing parameters';
  }

  // eslint-disable-next-line prettier/prettier
  const blobServiceClient = getBlobServiceClient(
    storageAccountName,
    storageAccountKey
  );
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
  storageAccountName: string,
  storageAccountKey: string,
  containerName: string
): Promise<ListFilesInContainerResponse> => {
  if (!storageAccountName || !storageAccountKey || !containerName) {
    return {
      error: true,
      errorMessage: 'List files in container function missing parameters',
      data: []
    };
  }

  // eslint-disable-next-line prettier/prettier
  const blobServiceClient = getBlobServiceClient(
    storageAccountName,
    storageAccountKey
  );
  const containerClient = blobServiceClient.getContainerClient(containerName);

  const data = [];

  for await (const response of containerClient
    .listBlobsFlat()
    .byPage({ maxPageSize: 20 })) {
    for (const blob of response.segment.blobItems) {
      data.push(`${containerClient.url}/${blob.name}`);
    }
  }

  return {
    error: false,
    errorMessage: '',
    data
  };
};
