import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { randomUUID } from 'crypto'
import { promises as fs } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import * as tesseract from 'node-tesseract-ocr'
import { MembershipService } from '../common/membership.service'

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']

export interface ReceiptItem {
  name: string
  price: number
}

@Injectable()
export class ReceiptsService {
  private readonly log = new Logger('Receipts')
  constructor(private readonly membership: MembershipService) {}

  /** OCR чека → best-effort распознавание позиций и итоговой суммы. */
  async ocr(userId: string, tripId: string, file: Express.Multer.File) {
    await this.membership.assertMember(userId, tripId)
    if (!file) throw new BadRequestException('Файл не передан')
    if (!ALLOWED.includes(file.mimetype)) throw new BadRequestException('Только изображения')

    const tmp = join(tmpdir(), randomUUID())
    await fs.writeFile(tmp, file.buffer)
    let text: string
    try {
      text = await tesseract.recognize(tmp, { lang: 'rus+eng', oem: 1, psm: 6 })
    } catch (e) {
      this.log.error(`tesseract: ${(e as Error).message}`)
      throw new BadRequestException('Не удалось распознать чек')
    } finally {
      await fs.unlink(tmp).catch(() => {})
    }

    return this.parse(text)
  }

  /** Грубый разбор: строки с ценой на конце → позиции; «итог» → total. */
  private parse(text: string) {
    const priceRe = /(\d[\d\s]*[.,]\d{2})\s*$/
    const totalKw = /(итог|всего|сумма|к\s*оплате|total)/i
    const items: ReceiptItem[] = []
    let total = 0

    for (const raw of text.split('\n')) {
      const line = raw.trim()
      if (!line) continue
      const m = line.match(priceRe)
      if (!m) continue
      const price = Number(m[1].replace(/\s/g, '').replace(',', '.'))
      if (!price) continue
      const name = line.replace(priceRe, '').trim()
      if (totalKw.test(line)) {
        total = Math.max(total, price)
      } else if (name) {
        items.push({ name, price })
      }
    }
    if (!total) total = items.reduce((s, i) => s + i.price, 0)

    return { rawText: text.trim(), items, total: Number(total.toFixed(2)) }
  }
}
