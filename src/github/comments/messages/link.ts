import { Node } from './node';

export class LinkNode extends Node {
  constructor(
    private text: string,
    private href: string,
  ) {
    super();
  }

  toGFM(): string {
    return `[${this.text}](${this.href})`;
  }

  toPlainText(): string {
    if (this.text === this.href) {
      return this.href;
    }

    return `${this.text} (${this.href})`;
  }
}
