export class Comment {
  text: string;

  constructor(text: string) {
    this.text = text;
  }

  toString(): string {
    return this.text;
  }
}

export class Property {
  key: string;
  value: string;

  constructor(key: string, value: string) {
    this.key = key;
    this.value = value;
  }

  toString(): string {
    return this.key + "=" + this.value;
  }
}

export class Properties {
  content: Array<Comment | Property> = [];

  constructor(input?: string) {
    if (input !== undefined) {
      const lines = input.split(/\r\n|\r|\n/);

      for (const line of lines) {
        if (line.startsWith("#") || line === "") {
          this.content.push(new Comment(line));
        } else {
          const entry = line.split("=");
          this.content.push(new Property(entry[0], entry[1]));
        }
      }
    }
  }

  toString(): string {
    return this.content.map((i) => i.toString()).join("\n");
  }

  list() {
    return this.content;
  }

  set(key: string, value: string) {
    let found: boolean = false;
    for (const item of this.content) {
      if (item instanceof Property && item.key === key) {
        item.value = value;
        found = true;
        break;
      }
    }

    if (!found) {
      this.content.push(new Property(key, value));
    }
  }

  get(key: string): string | null {
    for (const item of this.content) {
      if (item instanceof Property && item.key === key) {
        return item.value;
      }
    }
    return null;
  }
}
