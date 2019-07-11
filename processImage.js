const AWS = require("aws-sdk");
const Sharp = require("sharp");

const config = require('./config.json')

class AWSS3 {
  constructor() {
    this.config = {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      region: config.region
    };

    this.s3 = new AWS.S3(this.config);
  }

  async resizeAndUpload(payload) {

    const files = payload.files;
    const bucket = payload.bucket;
    const moduleId = payload.moduleId;
    const moduleName = payload.moduleName;
    const container = payload.container;
    const smallHeight =  300;
    const smallWidth =   300;
    const mediumHeight = 300;
    const mediumWidth =  300;

    const getFileS3 = (bucket, file) => new Promise((resolve,reject) => {
      this.s3.getObject({ Bucket: bucket, Key: file })
        .promise()
        .then(result => resolve(result))
        .catch(error => reject(error));
    })

    const sharpResizeSmallOrMedium = (imageFromS3, width ,height) => new Promise((resolve, reject) => {
      Sharp(imageFromS3)
      .resize(width, height)
      .toFormat('jpeg')
      .toBuffer()
      .then(buffer => resolve(buffer))
      .catch(error => reject(error))
    }) 
    
    const sharpResizeLarge = (imageFromS3) => new Promise((resolve, reject) => {
      Sharp(imageFromS3)
      .jpeg({
        quality: 50,
        chromaSubsampling: '4:4:4'
      })
      .toBuffer()
      .then(buffer => resolve(buffer))
      .catch(error => reject(error))
    }) 
    
    const sharpResizeActual = (imageFromS3) => new Promise((resolve, reject) => {
      Sharp(imageFromS3)
      .toFormat('jpeg')
      .toBuffer()
      .then(buffer => resolve(buffer))
      .catch(error => reject(error))
    })

    const putImageS3 = (imageBuffer, typeImage, target) => new Promise((resolve, reject) => {
      this.s3.putObject({
        Body: imageBuffer,
        ACL: 'public-read',
        Bucket: bucket,
        ContentType: 'image/jpeg',
        Key: `${moduleName}/${moduleId}/${container}/${typeImage}/${target}.jpeg`
      })
        .promise()
        .then(() => {
          console.log(
`upload de imagem feito com sucesso =>> 
${moduleName}/${moduleId}/${container}/${typeImage}/${target}.jpeg`
          );
          return resolve();
        })
        .catch(err => reject(err))
    })

    try {
      for (let i = 0; i < files.length; i++) {
        let file = files[i];

        let target = file.target;
        let filePath = file.path.toString();

        let fileFromS3 = await getFileS3(bucket, filePath);

        let imageFromS3 = fileFromS3.Body;

        let largeImage = await sharpResizeLarge(imageFromS3);
        let actualImage = await sharpResizeActual(imageFromS3);
        let smallImage = await sharpResizeSmallOrMedium(imageFromS3, smallWidth, smallHeight);
        let mediumImage = await sharpResizeSmallOrMedium(imageFromS3, mediumWidth, mediumHeight);

        await putImageS3(largeImage, 'large', target)
        await putImageS3(smallImage, 'small', target)
        await putImageS3(actualImage, 'actual', target)
        await putImageS3(mediumImage, 'medium', target)
          
      }
      return;
    } catch(error) {
      console.log('TCL: AWSS3 -> upload -> error', error)
      return error;
    }
  }
}

module.exports = new AWSS3();
