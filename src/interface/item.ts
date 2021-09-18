export class Node {
  constructor(public name: string, public nodes: (string|Node)[]) {}
}

export class ItemsTree {
  constructor(public nodes: Node[]) {}
}

