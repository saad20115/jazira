import { notFound } from 'next/navigation'

export default function CatchAllNotFoundPage(): never {
  notFound()
}
