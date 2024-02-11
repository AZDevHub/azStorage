import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob'

const serviceName = 'azdevhubapps'
const serviceKey =
    '29LZa14veyJUD+lbdGKhbt3syYYAyxa4kHtSoTD4+KrgSrxlhlxWNlbGhFOa+FW/Or7FaW/+SlsO+ASt/r6RgQ=='
const containerName = 'upload'

const sharedKeyCredential = new StorageSharedKeyCredential(serviceName, serviceKey)
const blobServiceClient = new BlobServiceClient(
    `https://${serviceName}.blob.core.windows.net`,
    sharedKeyCredential
)
const containerClient = blobServiceClient.getContainerClient(containerName)

async function listFilesInContainer() {
    const data = []
    for await (const response of containerClient.listBlobsFlat().byPage({ maxPageSize: 20 })) {
        for (const blob of response.segment.blobItems) {
            data.push(JSON.stringify(blob))
        }
    }
    return {
        error: false,
        errorMessage: '',
        data
    }
}

const listOfFiles = await listFilesInContainer()
console.log(listOfFiles)