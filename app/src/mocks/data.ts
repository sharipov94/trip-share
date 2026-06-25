// Мок-данные прототипа. В реале — из API (см. ../../docs/02-backend-spec.md).
import type { Trip } from '../types'

const M = (...names: string[]) =>
  names.map((name, i) => ({ id: 'u' + i, name, initial: name[0] }))

export const tripList: Trip[] = [
  {
    id: 'bcn-2027', title: 'Барселона 2027', dates: '12–19 июня · 5 человек',
    status: 'active', cls: 'g-a', currency: '€',
    members: M('Никита', 'Аня', 'Макс', 'Даша', 'Лев'),
  },
  {
    id: 'alps', title: 'Альпы road trip', dates: '3–9 марта · 4 человека',
    status: 'finished', cls: 'g-c', currency: '€',
    members: M('Никита', 'Аня', 'Лев', 'Соня'),
  },
  {
    id: 'lisboa', title: 'Лиссабон', dates: 'окт 2026 · 6 человек',
    status: 'planning', cls: 'g-b', currency: '€',
    members: M('Никита', 'Аня', 'Макс', 'Даша', 'Лев', 'Иван'),
  },
]

export const getTrip = (id?: string): Trip =>
  tripList.find((t) => t.id === id) ?? tripList[0]

// Активная поездка — для Home и др.
export const trip = tripList[0]

export const activities = [
  {
    id: 'a1', title: 'Музей Пикассо', time: '14:00', part: 'ДЕНЬ',
    sub: 'Carrer de Montcada, 15–23', status: 'confirmed', going: 4, night: false,
  },
  {
    id: 'a2', title: 'Ужин · El Xampanyet', time: '20:30', part: 'ВЕЧЕР',
    sub: 'Тапас-бар · ≈ €35 с человека', status: 'voting', going: 3, night: true,
  },
  {
    id: 'a3', title: 'Парк Гуэля', time: '10:00', part: 'УТРО',
    sub: 'Carrer d’Olot · билеты онлайн', status: 'confirmed', going: 5, night: false,
  },
]

export const expenses = [
  { id: 'e1', title: 'Музей Пикассо', cat: 'Активность', payer: 'Никита', amount: 60, cur: '€' },
  { id: 'e2', title: 'Обед · La Boqueria', cat: 'Ресторан', payer: 'Аня', amount: 84, cur: '€' },
  { id: 'e3', title: 'Такси из аэропорта', cat: 'Транспорт', payer: 'Макс', amount: 38, cur: '€' },
  { id: 'e4', title: 'Продукты', cat: 'Покупки', payer: 'Никита', amount: 52, cur: '€' },
]

// План минимальных переводов (результат оптимизации долгов)
export const settlements = [
  { id: 's1', fromId: 'me', toId: 'u-anya', toUsername: null as string | null, from: 'Ты', to: 'Аня', toInitial: 'А', amount: 42 },
  { id: 's2', fromId: 'u-max', toId: 'u-nikita', toUsername: null as string | null, from: 'Макс', to: 'Никита', toInitial: 'Н', amount: 28 },
  { id: 's3', fromId: 'u-lev', toId: 'u-anya', toUsername: null as string | null, from: 'Лев', to: 'Аня', toInitial: 'А', amount: 17 },
]

export const moment = {
  title: 'Закат на Бункерах',
  count: 5,
  shots: [
    { id: 'm1', author: 'Аня', cls: 's1' },
    { id: 'm2', author: 'Макс', cls: 's2' },
    { id: 'm3', author: 'Даша', cls: 's3' },
    { id: 'm4', author: 'Лев', cls: 's4' },
    { id: 'm5', author: 'Никита', cls: 's1' },
  ],
}

export const wrapped = [
  { num: '7', cap: 'Дней вместе', cls: 'g-a' },
  { num: '143', cap: 'Фотографии', cls: 'g-b' },
  { num: '94 км', cap: 'Пройдено пешком', cls: 'g-c' },
  { num: '12', cap: 'Активностей', cls: 'g-a' },
  { num: '€612', cap: 'Общие расходы', cls: 'g-b' },
  { num: '8', cap: 'Чашек кофе ☕', cls: 'g-c' },
]

export const categories = ['Активность', 'Ресторан', 'Транспорт', 'Бензин', 'Парковка', 'Проживание', 'Покупки', 'Другое']

export const comments = [
  { id: 'c1', author: 'Аня', initial: 'А', text: 'Беру билеты заранее, онлайн дешевле!' },
  { id: 'c2', author: 'Макс', initial: 'М', text: 'Я за. Только после 14:00, утром сплю 😴' },
  { id: 'c3', author: 'Даша', initial: 'Д', text: 'Возьмём аудиогид?' },
]

export const participants = [
  { id: 'u1', name: 'Никита', initial: 'Н', vote: 'going' },
  { id: 'u2', name: 'Аня', initial: 'А', vote: 'going' },
  { id: 'u3', name: 'Макс', initial: 'М', vote: 'going' },
  { id: 'u4', name: 'Даша', initial: 'Д', vote: 'maybe' },
  { id: 'u5', name: 'Лев', initial: 'Л', vote: 'not_going' },
]

export const receiptItems = [
  { id: 'r1', name: 'Паэлья', qty: 2, price: 28 },
  { id: 'r2', name: 'Сангрия', qty: 1, price: 14 },
  { id: 'r3', name: 'Хамон', qty: 1, price: 18 },
  { id: 'r4', name: 'Кофе', qty: 4, price: 12 },
  { id: 'r5', name: 'Десерт', qty: 2, price: 12 },
]

export const bingo = [
  { id: 'b1', text: 'Местный кот', done: true },
  { id: 'b2', text: 'Закат', done: true },
  { id: 'b3', text: 'Странный ценник', done: false },
  { id: 'b4', text: 'Групповое фото', done: true },
  { id: 'b5', text: 'Уличный музыкант', done: false },
  { id: 'b6', text: 'Граффити', done: true },
  { id: 'b7', text: 'Тарелка тапас', done: true },
  { id: 'b8', text: 'Море', done: false },
  { id: 'b9', text: 'Селфи с гидом', done: false },
]

export const wrappedPersonal = [
  { num: 'Никита', cap: 'Твой Wrapped поездки', cls: 'g-a' },
  { num: '41', cap: 'Фото снял ты — больше всех', cls: 'g-c' },
  { num: '👑', cap: 'Титул: Главный фотограф', cls: 'g-b' },
  { num: '23 км', cap: 'Прошёл за поездку', cls: 'g-a' },
  { num: '€164', cap: 'Твоя доля расходов', cls: 'g-c' },
]
