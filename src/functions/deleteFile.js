const { app } = require('@azure/functions');
const { BlobServiceClient } = require('@azure/storage-blob');

// Nombre de la variable de entorno con la cadena de conexión
const STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING; 
// Reemplaza con el nombre de tu contenedor
const CONTAINER_NAME = "archivos"; 

app.http('deleteBlob', {
    methods: ['DELETE'], // El método DELETE es semánticamente correcto
    authLevel: 'function', 
    handler: async (request, context) => {
        try {
             // Asegúrate de que la cadena de conexión esté disponible
            if (!STORAGE_CONNECTION_STRING) {
                return { status: 500, body: 'Storage connection string not configured.' };
            }
            
            // 1. Obtener el nombre del archivo
            const fileName = request.query.get('fileName');

            if (!fileName) {
                return { status: 400, body: 'Missing fileName query parameter.' };
            }

            // 2. Inicializar el cliente de Blob Service
            const blobServiceClient = BlobServiceClient.fromConnectionString(STORAGE_CONNECTION_STRING);
            const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
            const blockBlobClient = containerClient.getBlockBlobClient(fileName);

            // 3. Eliminar el archivo
            const deleteResponse = await blockBlobClient.deleteIfExists();

            if (!deleteResponse.succeeded) {
                 // El archivo no existía, pero la operación es exitosa si lo vemos como idempotente
                return { status: 200, body: `File ${fileName} was not found or could not be deleted.` };
            }

            context.log(`File '${fileName}' deleted successfully from container '${CONTAINER_NAME}'.`);

            return { 
                status: 200, 
                body: `File ${fileName} deleted successfully.`
            };

        } catch (error) {
            context.log(`Error deleting blob: ${error.message}`);
            return { status: 500, body: `Error deleting file: ${error.message}` };
        }
    }
});
