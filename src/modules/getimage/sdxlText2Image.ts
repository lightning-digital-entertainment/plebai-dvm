import { TextToImageRequest, TextToImageResponse, txt2img } from "./text-to-image"

type Props = {
    apiUrl?: string
  }

  export type Client = {
    apiUrl: string
    txt2img: (options: TextToImageRequest) => Promise<TextToImageResponse>
  }

  const sdxlText2Image = (props?: Props): Client => {
    const apiUrl = props?.apiUrl || process.env.GETIMG_URL

    return {
      apiUrl,
      txt2img: (options: TextToImageRequest) => txt2img(options, apiUrl),
    }
  }

  export default sdxlText2Image

