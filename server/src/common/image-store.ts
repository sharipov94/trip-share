import { randomUUID } from 'crypto'
import { promises as fs } from 'fs'
import { join } from 'path'
import sharp from 'sharp'

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? '/app/uploads'
const EXT: Record<string, string> = {
  'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/heic': '.heic',
}

/**
 * Сохраняет изображение на диск: ре-энкод в jpeg (удаляет EXIF/гео),
 * fallback на оригинал, если формат не декодится. Возвращает публичный путь /uploads/...
 */
export async function saveImage(file: Express.Multer.File): Promise<string> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true })
  let data: Buffer
  let name: string
  try {
    data = await sharp(file.buffer).rotate().jpeg({ quality: 82 }).toBuffer()
    name = randomUUID() + '.jpg'
  } catch {
    data = file.buffer
    name = randomUUID() + (EXT[file.mimetype] ?? '.bin')
  }
  await fs.writeFile(join(UPLOAD_DIR, name), data)
  return `/uploads/${name}`
}
