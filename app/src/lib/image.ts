// Клиентское сжатие фото перед загрузкой: даунскейл + jpeg.
// Ускоряет загрузку (особенно на мобильной сети). HEIC/неподдерживаемые форматы
// канвас не декодит — тогда отдаём оригинал (сервер сам ре-энкодит).
export async function compressImage(file: File, maxDim = 1600, quality = 0.7): Promise<File> {
  if (!file.type.startsWith('image/')) return file
  try {
    const img = await load(file)
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
    const w = Math.round(img.width * scale)
    const h = Math.round(img.height * scale)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(img, 0, 0, w, h)
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', quality))
    if (!blob || blob.size >= file.size) return file
    return new File([blob], 'photo.jpg', { type: 'image/jpeg' })
  } catch {
    return file
  }
}

function load(file: File): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image()
    img.onload = () => res(img)
    img.onerror = rej
    img.src = URL.createObjectURL(file)
  })
}
