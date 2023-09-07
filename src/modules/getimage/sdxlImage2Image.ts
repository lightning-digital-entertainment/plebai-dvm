import { ImageToImageRequest, ImageToImageResponse, img2img } from "./image-to-image"


type Props = {
    apiUrl?: string
  }

  export type Client = {
    apiUrl: string
    img2img: (options: ImageToImageRequest) => Promise<ImageToImageResponse>
  }

  const sdxlImage2Image = (props?: Props): Client => {
    const apiUrl = props?.apiUrl || process.env.GETIMG_URL

    return {
      apiUrl,
      img2img: (options: ImageToImageRequest) => img2img(options, apiUrl),
    }
  }

  export default sdxlImage2Image

