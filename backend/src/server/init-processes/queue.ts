// Узел для двусвязного списка
export class QueueNode<T> {
  val: T
  next: QueueNode<T> | null

  constructor(val: T) {
    this.val = val
    this.next = null
  }
}

// Класс очереди на базе двусвязного списка
export class Queue<T> {
  head: QueueNode<T> | null
  tail: QueueNode<T> | null
  size: number

  constructor() {
    this.head = null
    this.tail = null
    this.size = 0
  }

  // Добавить в конец (Enqueue) O(1)
  enqueue(val: T) {
    const newNode = new QueueNode<T>(val)

    if (this.size === 0) {
      this.head = newNode
      this.tail = newNode
    } else {
      this.tail!.next = newNode
      this.tail = newNode
    }

    this.size++
  }

  // Удалить из начала (Dequeue) O(1)
  dequeue(): T | null {
    if (this.size === 0) {
      return null
    }

    const val = this.head!.val

    this.head = this.head!.next
    this.size--

    if (this.size === 0) {
      this.tail = null
    }

    return val
  }

  isEmpty(): boolean {
    return this.size === 0
  }
}
