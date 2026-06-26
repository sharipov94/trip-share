import { Test } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { BotUpdateService, TelegramUpdate } from './bot-update.service'
import { MemoriesService } from '../memories/memories.service'

// Mock ioredis
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    quit: jest.fn(),
  }))
})

// Mock global fetch
global.fetch = jest.fn()

describe('BotUpdateService.handleUpdate', () => {
  let service: BotUpdateService
  let memoriesService: jest.Mocked<MemoriesService>
  let redisMock: { get: jest.Mock; quit: jest.Mock }

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        BotUpdateService,
        {
          provide: MemoriesService,
          useValue: { create: jest.fn().mockResolvedValue({}) },
        },
        {
          provide: ConfigService,
          useValue: { get: (key: string) => key === 'BOT_TOKEN' ? 'test-token' : '' },
        },
      ],
    }).compile()

    service = module.get(BotUpdateService)
    memoriesService = module.get(MemoriesService) as jest.Mocked<MemoriesService>

    // Access the private redis instance after onModuleInit
    const Redis = require('ioredis')
    redisMock = new Redis()
    // Replace the service's redis with our mock
    ;(service as any).redis = redisMock

    jest.clearAllMocks()
  })

  it('ignores updates without a message', async () => {
    await service.handleUpdate({ update_id: 1 } as TelegramUpdate)
    expect(memoriesService.create).not.toHaveBeenCalled()
  })

  it('ignores messages without a photo', async () => {
    const update: TelegramUpdate = { update_id: 1, message: { message_id: 1, from: { id: 111 }, chat: { id: 111 } } as any }
    await service.handleUpdate(update)
    expect(memoriesService.create).not.toHaveBeenCalled()
  })

  it('sends error when photo has no reply_to_message context', async () => {
    redisMock.get = jest.fn().mockResolvedValue(null)
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue({}) })

    const update: TelegramUpdate = {
      update_id: 1,
      message: {
        message_id: 5,
        from: { id: 111 },
        chat: { id: 111 },
        photo: [{ file_id: 'abc', width: 100, height: 100 }],
        reply_to_message: { message_id: 42 },
      },
    }
    await service.handleUpdate(update)
    expect(memoriesService.create).not.toHaveBeenCalled()
    // Should call sendMessage with error text
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/sendMessage'),
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('creates memory when photo is a reply with valid context', async () => {
    const ctx = JSON.stringify({ tripId: 'trip-1', userId: 'user-1', phase: 'before_trip', takenAt: '2027-06-11T12:00:00.000Z' })
    redisMock.get = jest.fn().mockResolvedValue(ctx)

    const fakeBuffer = Buffer.from('fake-image-data')
    ;(global.fetch as jest.Mock)
      // getFile call
      .mockResolvedValueOnce({ json: jest.fn().mockResolvedValue({ result: { file_path: 'photos/file.jpg' } }) })
      // download call
      .mockResolvedValueOnce({ arrayBuffer: jest.fn().mockResolvedValue(fakeBuffer.buffer) })
      // sendMessage (success reply) call
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue({}) })

    const update: TelegramUpdate = {
      update_id: 1,
      message: {
        message_id: 5,
        from: { id: 111 },
        chat: { id: 111 },
        photo: [
          { file_id: 'small', width: 100, height: 100 },
          { file_id: 'large', width: 800, height: 600 },
        ],
        reply_to_message: { message_id: 42 },
      },
    }
    await service.handleUpdate(update)

    expect(memoriesService.create).toHaveBeenCalledWith(
      'user-1',
      'trip-1',
      expect.objectContaining({ mimetype: 'image/jpeg' }),
      { phase: 'before_trip', takenAt: '2027-06-11T12:00:00.000Z' },
    )
  })
})
