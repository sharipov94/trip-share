import { apiUpload, MOCK } from './client'
import { wait } from './_internal'
import * as mock from '../mocks/data'

export const receipts = {
  async ocr(tripId: string, file: File): Promise<{ rawText: string; items: { name: string; price: number }[]; total: number }> {
    if (MOCK) {
      return wait({
        rawText: '', total: mock.receiptItems.reduce((s, r) => s + r.price, 0),
        items: mock.receiptItems.map((r) => ({ name: r.name, price: r.price })),
      })
    }
    const form = new FormData()
    form.append('photo', file)
    return apiUpload(`/trips/${tripId}/receipt-ocr`, form)
  },
}
