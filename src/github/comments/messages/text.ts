import { Node } from './node';

export class TextNode extends Node {
  constructor(private text: string) {
    super();
  }

  toGFM(): string {
    return this.text;
  }

  toPlainText(): string {
    return this.text;
  }
}
