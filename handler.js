const processImage = require('./processImage')

module.exports.processImages = async (event) => {
    console.log('TCL: module.exports.processImages -> event', event.body)
    const data = event.body
    console.log('TCL: module.exports.processImages -> data', data)
    const payload = data
    const bucket = "your-bucket-name"
    payload.bucket = bucket
    const response = (statusCode, booleanStatus) => {
        return {
            statusCode: statusCode,
            body: booleanStatus,
        }
    }
    try {
        if (payload.accessKeyId !== processImage.config.accessKeyId) {
            throw new Error('your not authorized!')
        }
        await processImage.resizeAndUpload(payload);
        return response(200, { status: true });
    } catch(err) {
        console.log('TCL: module.exports.processImages -> err', err)
        return response(400, { status: false, err } )
    }
}
