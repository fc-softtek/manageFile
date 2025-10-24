const { app } = require('@azure/functions');
const { BlobServiceClient } = require('@azure/storage-blob');

// Nombre de la variable de entorno con la cadena de conexión
const STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING; 
// Reemplaza con el nombre de tu contenedor
const CONTAINER_NAME = "archivos"; 

app.http('uploadBlob', {
    methods: ['POST'],
    authLevel: 'function', // Usa 'function' para seguridad por clave
    handler: async (request, context) => {
        try {
            // Asegúrate de que la cadena de conexión esté disponible
            if (!STORAGE_CONNECTION_STRING) {
                return { status: 500, body: 'Storage connection string not configured.' };
            }

            // 1. Obtener el nombre del archivo y el contenido
            // Se asume que el nombre del archivo se pasa como un query parameter
            const fileName = request.query.get('fileName'); 
            const fileContent = await request.buffer(); // Obtener el cuerpo como buffer

            if (!fileName || fileContent.length === 0) {
                return { status: 400, body: 'Missing fileName query parameter or file content in body.' };
            }

            // 2. Inicializar el cliente de Blob Service
            const blobServiceClient = BlobServiceClient.fromConnectionString(STORAGE_CONNECTION_STRING);
            const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
            const blockBlobClient = containerClient.getBlockBlobClient(fileName);

            // 3. Subir el archivo
            await blockBlobClient.uploadData(fileContent);

            context.log(`File '${fileName}' uploaded successfully to container '${CONTAINER_NAME}'.`);

            return { 
                status: 200, 
                body: JSON.stringify({ message: `File ${fileName} uploaded successfully.`, blobUrl: blockBlobClient.url })
            };

        } catch (error) {
            context.log(`Error uploading blob: ${error.message}`);
            return { status: 500, body: `Error uploading file: ${error.message}` };
        }
    }
});