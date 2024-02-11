const { app } = require('@azure/functions');
const handlers = {
    status: require('./src/functions/status'),
    upload: require('./src/functions/upload'),
    sas: require('./src/functions/sas'),
    list: require('./src/functions/list')
};

const routes = [
    { path: 'upload', method: 'post', handler: 'upload' },
    { path: 'sas', method: 'get', handler: 'sas' },
    { path: 'list', method: 'get', handler: 'list' },
    { path: 'status', method: 'get', handler: 'status' }
];

routes.forEach(({ path, method, handler }) => {
    app[method](path, {
        methods: [method.toUpperCase()],
        authLevel: 'anonymous',
        handler: handlers[handler]
    });
});

module.exports = app;