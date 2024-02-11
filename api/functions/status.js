module.exports = async function(request, context) {
    context.log(`Http function processed request for url "${request.url}"`);

    context.res.json({
        status: 200,
        data: { status: 'API Online' }
    })
}