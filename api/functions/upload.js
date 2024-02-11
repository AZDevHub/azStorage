const {
    BlobServiceClient,
    StorageSharedKeyCredential,
    BlobUploadCommonResponse,
} = require('@azure/storage-blob');

module.exports = async function(request, context) {
    context.log(`Http function processed request for url "${request.url}"`);

    const containerName = process.env.UploadContainer || 'upload';
    const endpoint = process.env.Endpoint;
    const accountName = process.env.Azure_Storage_AccountName;
    const accessKey = process.env.Azure_Storage_AccountKey;

    try {
        const sharedKeyCredential = new StorageSharedKeyCredential(
            accountName,
            accessKey
        );
        const blobServiceClient = new BlobServiceClient(
            endpoint,
            sharedKeyCredential
        );

        const filename =
            `${request.query.get('filename').split('.')[0]}-${Date.now()}.${
				request.query.get('filename').split('.')[1]
			}` || `file-{${Date.now()}}`;

        const path = `${containerName}/${filename}`;
        context.log(path);

        // file content must be passed in body
        const formData = await request.formData();
        const uploadedFile = formData.get('file');

        // File
        const fileContents = await uploadedFile.arrayBuffer();
        const fileContentsBuffer = Buffer.from(fileContents);
        const size = fileContentsBuffer.byteLength;
        context.log(
            `lastModified = ${uploadedFile?.lastModified}, size = ${size}`
        );

        const containerClient =
            blobServiceClient.getContainerClient(containerName);
        const blockBlobClient = containerClient.getBlockBlobClient(filename);

        await blockBlobClient.upload(
            fileContentsBuffer,
            fileContentsBuffer.length
        );
        const sasTokenUrl = `${blockBlobClient.url}`;

        context.res.json({
            status: 200,
            data: { sasTokenUrl: sasTokenUrl },
        });
    } catch (error) {
        context.log(error);
        context.res.json({
            status: 500,
            data: { error: 'An error occurred while uploading the file' }
        });
    }
};