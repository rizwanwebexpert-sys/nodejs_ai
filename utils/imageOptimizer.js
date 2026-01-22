const sharp= require("sharp");

/**
 * Optimizes dental images for AI processing
 * Preserves natural aesthetics & proportions
 */
async function optimizeDentalImage(buffer) {
  return sharp(buffer)
    .rotate() // auto-fix orientation
    .resize({
      width: 2048,
      height: 2048,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({
      quality: 95,
      chromaSubsampling: "4:4:4",
      mozjpeg: true,
    })
    .toBuffer();
}

module.exports=optimizeDentalImage
