const { BlobServiceClient } = require('@azure/storage-blob');

module.exports = async function(request, context) {
    context.log(`Http function processed request for url "${request.url}"`);
    const containerName = request.query.get('container') || process.env.UploadContainer;
    const connectionString = process.env.Azure_Storage_ConnectionString;

    try {
        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        const containerClient = blobServiceClient.getContainerClient(containerName);
        const data = [];

        for await (const response of containerClient.listBlobsFlat().byPage({ maxPageSize: 20 })) {
            for (const blob of response.segment.blobItems) {
                data.push(`${containerClient.url}/${blob.name}`);
            }
        }

        context.res.json({ status: 200, data: { list: data } });
    } catch (error) {
        context.log(error);
        context.res.json({ status: 500, data: { error: 'An error occurred while listing the files' } });
    };
}