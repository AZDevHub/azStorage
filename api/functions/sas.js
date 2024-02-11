const {
    BlobServiceClient,
    StorageSharedKeyCredential,
    generateBlobSASQueryParameters,
    BlobSASPermissions,
} = require('@azure/storage-blob');

module.exports = async function(request, context) {
    context.log(`Http function processed request for url "${request.url}"`);
    const containerName = process.env.UploadContainer || 'upload';
    const accountName = process.env.Azure_Storage_AccountName;
    const accessKey = process.env.Azure_Storage_AccountKey;
    const endpoint = process.env.Endpoint;
    const fileName = request.query.get('file') || 'nonamefile';
    const permissions = request.query.get('permission') || 'w';
    const timerange = parseInt(request.query.get('timerange') || '10'); // 10 minutes

    context.log(`containerName: ${containerName}`);
    context.log(`fileName: ${fileName}`);
    context.log(`permissions: ${permissions}`);
    context.log(`timerange: ${timerange}`);

    try {
        const sharedKeyCredential = new StorageSharedKeyCredential(
            accountName,
            accessKey
        );
        const blobSAS = generateBlobSASQueryParameters({
                containerName,
                blobName: fileName,
                permissions: BlobSASPermissions.parse(permissions),
                startsOn: new Date(),
                expiresOn: new Date(new Date().valueOf() + timerange * 60 * 1000),
            },
            sharedKeyCredential
        );

        const sasUrl = `${endpoint}/${containerName}/${fileName}?${blobSAS}`;

        context.res.json({ status: 200, data: { sasUrl: sasUrl } });
    } catch (error) {
        context.log(error);
        context.res.json({
            status: 500,
            data: { error: 'An error occurred while generating the SAS token' }
        });
    }
};