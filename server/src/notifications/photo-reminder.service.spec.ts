import { buildSlotSchedules } from './photo-reminder.service'

describe('buildSlotSchedules', () => {
  it('1-day trip produces 3 slots: before, day_1, after', () => {
    const slots = buildSlotSchedules('2027-06-12', '2027-06-12')
    expect(slots.map((s) => s.key)).toEqual(['before_trip', 'day_1', 'after_trip'])
  })

  it('3-day trip produces 5 slots', () => {
    const slots = buildSlotSchedules('2027-06-12', '2027-06-14')
    expect(slots.map((s) => s.key)).toEqual(['before_trip', 'day_1', 'day_2', 'day_3', 'after_trip'])
  })

  it('before_trip fires at 06:00 UTC the day before startDate', () => {
    const slots = buildSlotSchedules('2027-06-12', '2027-06-12')
    expect(slots[0].fireTime.toISOString()).toBe('2027-06-11T06:00:00.000Z')
  })

  it('day_1 fires at 06:00 UTC on startDate', () => {
    const slots = buildSlotSchedules('2027-06-12', '2027-06-12')
    expect(slots[1].fireTime.toISOString()).toBe('2027-06-12T06:00:00.000Z')
  })

  it('day_2 fires at 06:00 UTC on startDate + 1 day', () => {
    const slots = buildSlotSchedules('2027-06-12', '2027-06-14')
    expect(slots[2].fireTime.toISOString()).toBe('2027-06-13T06:00:00.000Z')
  })

  it('after_trip fires at 06:00 UTC the day after endDate', () => {
    const slots = buildSlotSchedules('2027-06-12', '2027-06-12')
    expect(slots[2].fireTime.toISOString()).toBe('2027-06-13T06:00:00.000Z')
  })

  it('before_trip takenAt is noon UTC day before startDate', () => {
    const slots = buildSlotSchedules('2027-06-12', '2027-06-12')
    expect(slots[0].takenAt).toBe('2027-06-11T12:00:00.000Z')
  })

  it('day_1 takenAt is noon UTC of startDate', () => {
    const slots = buildSlotSchedules('2027-06-12', '2027-06-14')
    expect(slots[1].takenAt).toBe('2027-06-12T12:00:00.000Z')
  })

  it('day_3 takenAt is noon UTC of startDate+2', () => {
    const slots = buildSlotSchedules('2027-06-12', '2027-06-14')
    expect(slots[3].takenAt).toBe('2027-06-14T12:00:00.000Z')
  })

  it('after_trip takenAt is noon UTC day after endDate', () => {
    const slots = buildSlotSchedules('2027-06-12', '2027-06-12')
    expect(slots[2].takenAt).toBe('2027-06-13T12:00:00.000Z')
  })

  it('before_trip label is "До поездки"', () => {
    const slots = buildSlotSchedules('2027-06-12', '2027-06-12')
    expect(slots[0].label).toBe('До поездки')
  })

  it('day_2 label is "День 2"', () => {
    const slots = buildSlotSchedules('2027-06-12', '2027-06-14')
    expect(slots[2].label).toBe('День 2')
  })

  it('after_trip label is "После поездки"', () => {
    const slots = buildSlotSchedules('2027-06-12', '2027-06-12')
    expect(slots[2].label).toBe('После поездки')
  })
})
