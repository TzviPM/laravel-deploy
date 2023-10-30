import { Node } from './node';

export class SequenceNode extends Node {
  constructor(private nodes: Node[]) {
    super();
  }

  toGFM(): string {
    return this.nodes.map((node) => node.toGFM()).join(' ');
  }

  toPlainText(): string {
    return this.nodes.map((node) => node.toPlainText()).join(' ');
  }
}
