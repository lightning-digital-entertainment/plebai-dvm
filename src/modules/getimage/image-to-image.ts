export type ImageToImageRequest ={
    model: string;
    prompt: string;
    image: string;
    negative_prompt: string;
    width: number;
    height: number;
    steps: number;
    guidance: number;
    seed: number;
    scheduler: string;
    output_format: string;
}

export type ImageToImageResponse = {


  "image": string,
  "seed": number
}

const mapImg2ImgOptions = (options: ImageToImageRequest) => {
    const body: any = {

        "model": options.model,
        "prompt": options.prompt,
        "image": options.image,
        "negative_prompt": options.negative_prompt,
        "width": options.width,
         "height": options.height,
        "steps": options.steps,
        "guidance": options.guidance,
        "seed": options.seed,
        "scheduler": options.scheduler,
        "output_format": options.output_format

    }

    return body

}

export const img2img = async (
    options: ImageToImageRequest,
    apiUrl: string = process.env.GETIMG_URL
  ): Promise<ImageToImageResponse> => {
    const body = mapImg2ImgOptions(options)

    const endpoint = '/stable-diffusion/image-to-image'

    console.log(body);

    const result = await fetch(`${apiUrl}${endpoint}`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.GETIMG_ACCESS_TOKEN
      },
    })

    if (result.status !== 200) {
      console.log(result);
    }

    const data: any = await result.json()
    if (!data?.image) {
      throw new Error('api returned an invalid response')
    }

    return data as ImageToImageResponse
}