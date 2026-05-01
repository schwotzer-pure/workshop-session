import { Text, View, Link, StyleSheet } from "@react-pdf/renderer";
import { marked, type Tokens } from "marked";

// `@react-pdf/types` isn't a hoisted dep — narrow style type locally.
type Style = Record<string, string | number | undefined>;

/**
 * Lightweight Markdown → @react-pdf renderer.
 * Supports: paragraphs, h3, bullet/ordered lists, bold, italic, strikethrough, links.
 * Anything not supported renders as plain text fallback.
 */

const styles = StyleSheet.create({
  paragraph: {
    fontSize: 10,
    lineHeight: 1.45,
    marginBottom: 4,
  },
  heading3: {
    fontSize: 11,
    fontWeight: 600,
    marginTop: 6,
    marginBottom: 3,
  },
  list: {
    marginBottom: 4,
  },
  listItem: {
    flexDirection: "row",
    fontSize: 10,
    lineHeight: 1.45,
    marginBottom: 2,
    paddingLeft: 4,
  },
  listMarker: {
    width: 12,
    color: "#666",
  },
  listBody: {
    flex: 1,
  },
  link: {
    color: "#7e3af2",
    textDecoration: "underline",
  },
});

type InlineStyle = {
  bold?: boolean;
  italic?: boolean;
  strike?: boolean;
};

function renderInline(
  tokens: Tokens.Generic[] | undefined,
  inheritedStyle: InlineStyle = {},
  textStyle?: Style
): React.ReactNode {
  if (!tokens) return null;
  return tokens.map((token, idx) => {
    const key = `${token.type}-${idx}`;

    if (token.type === "text") {
      const t = token as Tokens.Text;
      const style: Style[] = [];
      if (inheritedStyle.bold) style.push({ fontFamily: "Helvetica-Bold" });
      if (inheritedStyle.italic) style.push({ fontFamily: "Helvetica-Oblique" });
      if (inheritedStyle.strike) style.push({ textDecoration: "line-through" });
      if (textStyle) style.push(textStyle);
      return (
        <Text key={key} style={style as never}>
          {t.text}
        </Text>
      );
    }

    if (token.type === "strong") {
      const t = token as Tokens.Strong;
      return (
        <Text key={key}>
          {renderInline(t.tokens as Tokens.Generic[], { ...inheritedStyle, bold: true }, textStyle)}
        </Text>
      );
    }

    if (token.type === "em") {
      const t = token as Tokens.Em;
      return (
        <Text key={key}>
          {renderInline(t.tokens as Tokens.Generic[], { ...inheritedStyle, italic: true }, textStyle)}
        </Text>
      );
    }

    if (token.type === "del") {
      const t = token as Tokens.Del;
      return (
        <Text key={key}>
          {renderInline(t.tokens as Tokens.Generic[], { ...inheritedStyle, strike: true }, textStyle)}
        </Text>
      );
    }

    if (token.type === "link") {
      const t = token as Tokens.Link;
      return (
        <Link key={key} src={t.href} style={styles.link}>
          {renderInline(t.tokens as Tokens.Generic[], inheritedStyle, textStyle)}
        </Link>
      );
    }

    if (token.type === "br") {
      return <Text key={key}>{"\n"}</Text>;
    }

    if (token.type === "codespan") {
      const t = token as Tokens.Codespan;
      const style: Style[] = [{ fontFamily: "Courier", backgroundColor: "#f0f0f0" }];
      if (textStyle) style.push(textStyle);
      return (
        <Text key={key} style={style as never}>
          {t.text}
        </Text>
      );
    }

    // Fallback for unsupported inline types
    if ("text" in token && typeof token.text === "string") {
      return <Text key={key}>{token.text}</Text>;
    }
    return null;
  });
}

function renderBlock(token: Tokens.Generic, idx: number, paragraphStyle?: Style): React.ReactNode {
  const key = `${token.type}-${idx}`;

  if (token.type === "heading") {
    const t = token as Tokens.Heading;
    return (
      <Text key={key} style={styles.heading3}>
        {renderInline(t.tokens as Tokens.Generic[])}
      </Text>
    );
  }

  if (token.type === "paragraph") {
    const t = token as Tokens.Paragraph;
    const style: Style[] = [styles.paragraph as Style];
    if (paragraphStyle) style.push(paragraphStyle);
    return (
      <Text key={key} style={style as never}>
        {renderInline(t.tokens as Tokens.Generic[], {}, paragraphStyle)}
      </Text>
    );
  }

  if (token.type === "list") {
    const t = token as Tokens.List;
    return (
      <View key={key} style={styles.list}>
        {t.items.map((item, itemIdx) => (
          <View key={itemIdx} style={styles.listItem}>
            <Text style={styles.listMarker}>
              {t.ordered ? `${itemIdx + 1}.` : "•"}
            </Text>
            <View style={styles.listBody}>
              {(item.tokens as Tokens.Generic[]).map((sub, subIdx) => {
                const itemStyle: Style[] = [styles.paragraph as Style, { marginBottom: 0 }];
                if (paragraphStyle) itemStyle.push(paragraphStyle);
                if (sub.type === "text") {
                  const st = sub as Tokens.Text;
                  if (st.tokens) {
                    return (
                      <Text key={subIdx} style={itemStyle as never}>
                        {renderInline(st.tokens as Tokens.Generic[], {}, paragraphStyle)}
                      </Text>
                    );
                  }
                  return (
                    <Text key={subIdx} style={itemStyle as never}>
                      {st.text}
                    </Text>
                  );
                }
                return renderBlock(sub, subIdx, paragraphStyle);
              })}
            </View>
          </View>
        ))}
      </View>
    );
  }

  if (token.type === "space") {
    return null;
  }

  // Fallback: emit raw text if available
  if ("text" in token && typeof token.text === "string") {
    const style: Style[] = [styles.paragraph as Style];
    if (paragraphStyle) style.push(paragraphStyle);
    return (
      <Text key={key} style={style as never}>
        {token.text}
      </Text>
    );
  }
  return null;
}

/**
 * Parse markdown and return an array of @react-pdf nodes.
 * If markdown is empty/null, returns null.
 *
 * @param markdown - The markdown source.
 * @param paragraphStyle - Optional style to apply to paragraph text (color, fontSize, etc.).
 */
export function renderMarkdown(
  markdown: string | null | undefined,
  paragraphStyle?: Style
): React.ReactNode {
  if (!markdown?.trim()) return null;
  const tokens = marked.lexer(markdown);
  return tokens.map((token, idx) => renderBlock(token as Tokens.Generic, idx, paragraphStyle));
}
