import { LinkNode } from './link';
import { Node } from './node';
import { SequenceNode } from './sequence';
import { TextNode } from './text';

export class Message {
  static Text(text: string) {
    return new Message(new TextNode(text));
  }

  static Link(text: string, href?: string) {
    if (href == null) {
      href = text;
    }
    return new Message(new LinkNode(text, href));
  }

  static Seq(...nodes: Node[]) {
    return new Message(new SequenceNode(nodes));
  }

  private constructor(private root: Node) {}

  toPlainText(): string {
    return this.root.toPlainText();
  }

  toGFM(): string {
    return this.root.toGFM();
  }
}
