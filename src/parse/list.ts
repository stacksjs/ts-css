/**
 * Doubly linked list used as the children container for every CSS AST node.
 *
 * Mirrors css-tree's `List` so `csstree.List` import sites can switch to
 * `import { CssList as List } from '@stacksjs/ts-css/parse'` without changing
 * call sites. The list owns its `ListItem<T>` cells; items can be moved
 * between lists by detach/insert pairs.
 */

export interface ListItem<T> {
  prev: ListItem<T> | null
  next: ListItem<T> | null
  data: T
}

function createItem<T>(data: T): ListItem<T> {
  return { prev: null, next: null, data }
}

interface ListCursor<T> {
  prev: ListItem<T> | null
  next: ListItem<T> | null
}

export class CssList<T> {
  head: ListItem<T> | null = null
  tail: ListItem<T> | null = null

  // ----- mutation cursors -----
  // Each list owns its own cursor stack. Callbacks may insert/remove items
  // mid-walk; the topmost active cursor records the in-progress prev/next
  // pointers so a removal that lands on the cursor's `next` slot can be
  // repointed onto the survivor. Per-list (not module-global) so nested
  // walks of the same list don't corrupt each other.
  private cursors: ListCursor<T>[] = []

  private allocateCursor(prev: ListItem<T> | null, next: ListItem<T> | null): ListCursor<T> {
    const cursor: ListCursor<T> = { prev, next }
    this.cursors.push(cursor)
    return cursor
  }

  private releaseCursor(): void {
    this.cursors.pop()
  }

  private updateCursors(prevOld: ListItem<T> | null, prevNew: ListItem<T> | null, nextOld: ListItem<T> | null, nextNew: ListItem<T> | null): void {
    for (const c of this.cursors) {
      if (c.prev === prevOld)
        c.prev = prevNew
      if (c.next === nextOld)
        c.next = nextNew
    }
  }

  static createItem<U>(data: U): ListItem<U> {
    return createItem(data)
  }

  createItem(data: T): ListItem<T> {
    return createItem(data)
  }

  get isEmpty(): boolean {
    return this.head === null
  }

  get first(): T | null {
    return this.head?.data ?? null
  }

  get last(): T | null {
    return this.tail?.data ?? null
  }

  *[Symbol.iterator](): Iterator<T> {
    for (let cur = this.head; cur != null; cur = cur.next)
      yield cur.data
  }

  fromArray(items: ReadonlyArray<T>): this {
    let prev: ListItem<T> | null = null
    this.head = null
    for (const data of items) {
      const item = createItem(data)
      item.prev = prev
      if (prev)
        prev.next = item
      else
        this.head = item
      prev = item
    }
    this.tail = prev
    return this
  }

  toArray(): T[] {
    const out: T[] = []
    for (let cur = this.head; cur != null; cur = cur.next)
      out.push(cur.data)
    return out
  }

  toJSON(): T[] {
    return this.toArray()
  }

  /**
   * css-tree-style forEach: callback receives `(data, item, list)`.
   * The `item` is the underlying `ListItem<T>`, not the index — call sites
   * use it with `list.remove(item)` / `list.replace(item, ...)`.
   */
  // eslint-disable-next-line pickier/no-unused-vars
  forEach(fn: (data: T, item: ListItem<T>, list: CssList<T>) => void, thisArg?: any): void {
    const cursor = this.allocateCursor(null, this.head)
    while (cursor.next !== null) {
      const item = cursor.next as ListItem<T>
      cursor.prev = item
      cursor.next = item.next
      fn.call(thisArg, item.data, item, this)
    }
    this.releaseCursor()
  }

  // eslint-disable-next-line pickier/no-unused-vars
  forEachRight(fn: (data: T, item: ListItem<T>, list: CssList<T>) => void, thisArg?: any): void {
    const cursor = this.allocateCursor(this.tail, null)
    while (cursor.prev !== null) {
      const item = cursor.prev as ListItem<T>
      cursor.next = item
      cursor.prev = item.prev
      fn.call(thisArg, item.data, item, this)
    }
    this.releaseCursor()
  }

  // eslint-disable-next-line pickier/no-unused-vars
  reduce<U>(fn: (acc: U, data: T, index: number, list: CssList<T>) => U, initial: U): U {
    let acc = initial
    let i = 0
    for (let cur = this.head; cur != null; cur = cur.next)
      acc = fn(acc, cur.data, i++, this)
    return acc
  }

  // eslint-disable-next-line pickier/no-unused-vars
  some(fn: (item: T, index: number, list: CssList<T>) => boolean): boolean {
    let i = 0
    for (let cur = this.head; cur != null; cur = cur.next) {
      if (fn(cur.data, i++, this))
        return true
    }
    return false
  }

  // eslint-disable-next-line pickier/no-unused-vars
  map<U>(fn: (item: T, index: number, list: CssList<T>) => U): CssList<U> {
    const result = new CssList<U>()
    let prev: ListItem<U> | null = null
    let i = 0
    for (let cur = this.head; cur != null; cur = cur.next) {
      const item = createItem(fn(cur.data, i++, this))
      item.prev = prev
      if (prev)
        prev.next = item
      else
        result.head = item
      prev = item
    }
    result.tail = prev
    return result
  }

  // eslint-disable-next-line pickier/no-unused-vars
  filter(fn: (item: T, index: number, list: CssList<T>) => boolean): CssList<T> {
    const result = new CssList<T>()
    let prev: ListItem<T> | null = null
    let i = 0
    for (let cur = this.head; cur != null; cur = cur.next) {
      if (fn(cur.data, i++, this)) {
        const item = createItem(cur.data)
        item.prev = prev
        if (prev)
          prev.next = item
        else
          result.head = item
        prev = item
      }
    }
    result.tail = prev
    return result
  }

  clear(): void {
    // Unlink every item so consumers that retained a reference via
    // `forEach`/`map` callbacks don't keep the rest of the chain alive
    // through the prev/next pointers (which would defeat GC and let
    // mutations on a "cleared" list surprise other code holding handles).
    let cur = this.head
    while (cur) {
      const nxt = cur.next
      cur.prev = null
      cur.next = null
      cur = nxt
    }
    this.head = null
    this.tail = null
  }

  copy(): CssList<T> {
    const result = new CssList<T>()
    let prev: ListItem<T> | null = null
    for (let cur = this.head; cur != null; cur = cur.next) {
      const item = createItem(cur.data)
      item.prev = prev
      if (prev)
        prev.next = item
      else
        result.head = item
      prev = item
    }
    result.tail = prev
    return result
  }

  prepend(item: ListItem<T>): this {
    return this.insert(item, this.head)
  }

  prependData(data: T): this {
    return this.insert(createItem(data), this.head)
  }

  append(item: ListItem<T>): this {
    return this.insert(item, null)
  }

  appendData(data: T): this {
    return this.insert(createItem(data), null)
  }

  /** Insert `item` before `before`, or at tail if `before` is null/undefined. */
  insert(item: ListItem<T>, before: ListItem<T> | null | undefined = null): this {
    if (before != null) {
      this.updateCursors(before.prev, item, before, item)
      if (before.prev === null) {
        if (this.head !== before)
          throw new Error('before doesn\'t belong to list')
        this.head = item
        before.prev = item
        item.next = before
        this.updateCursors(null, item, null, null)
      }
      else {
        before.prev.next = item
        item.prev = before.prev
        before.prev = item
        item.next = before
      }
    }
    else {
      this.updateCursors(this.tail, item, null, item)
      if (this.tail !== null) {
        this.tail.next = item
        item.prev = this.tail
        this.tail = item
      }
      else {
        this.head = item
        this.tail = item
      }
    }
    return this
  }

  insertData(data: T, before: ListItem<T> | null = null): this {
    return this.insert(createItem(data), before)
  }

  remove(item: ListItem<T>): ListItem<T> {
    this.updateCursors(item, item.prev, item, item.next)
    if (item.prev !== null)
      item.prev.next = item.next
    else if (this.head === item)
      this.head = item.next
    else
      throw new Error('item doesn\'t belong to list')
    if (item.next !== null)
      item.next.prev = item.prev
    else if (this.tail === item)
      this.tail = item.prev
    else
      throw new Error('item doesn\'t belong to list')
    item.prev = null
    item.next = null
    return item
  }

  push(data: T): void {
    this.insert(createItem(data), null)
  }

  pop(): ListItem<T> | null {
    if (this.tail === null)
      return null
    return this.remove(this.tail)
  }

  unshift(data: T): void {
    this.prependData(data)
  }

  shift(): ListItem<T> | null {
    if (this.head === null)
      return null
    return this.remove(this.head)
  }

  prependList(list: CssList<T>): this {
    return this.insertList(list, this.head)
  }

  appendList(list: CssList<T>): this {
    return this.insertList(list, null)
  }

  insertList(list: CssList<T>, before: ListItem<T> | null = null): this {
    if (list.head === null)
      return this
    if (before !== null) {
      this.updateCursors(before.prev, list.tail, before, list.head)
      if (before.prev !== null) {
        before.prev.next = list.head
        list.head.prev = before.prev
      }
      else {
        this.head = list.head
      }
      before.prev = list.tail
      list.tail!.next = before
    }
    else {
      this.updateCursors(this.tail, list.tail, null, list.head)
      if (this.tail !== null) {
        this.tail.next = list.head
        list.head.prev = this.tail
      }
      else {
        this.head = list.head
      }
      this.tail = list.tail
    }
    list.head = null
    list.tail = null
    return this
  }

  replace(oldItem: ListItem<T>, newItemOrList: ListItem<T> | CssList<T>): void {
    if (newItemOrList instanceof CssList) {
      this.insertList(newItemOrList, oldItem)
      this.remove(oldItem)
    }
    else {
      this.insert(newItemOrList, oldItem)
      this.remove(oldItem)
    }
  }
}

/**
 * Convenience constructor matching `csstree.List()` (callable without `new`).
 */
export function makeList<T>(): CssList<T> {
  return new CssList<T>()
}
