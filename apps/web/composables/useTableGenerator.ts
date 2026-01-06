export function useTableGenerator() {
  function generateTableMarkdown(rows: number, cols: number): string {
    if (rows <= 0 || rows > 20 || cols <= 0 || cols > 10) {
      return '';
    }

    let tableMarkdown = '';

    // ヘッダー行
    tableMarkdown +=
      '| ' +
      Array(cols)
        .fill('Header')
        .map((h, i) => `${h}${i + 1}`)
        .join(' | ') +
      ' |\n';

    // 区切り行
    tableMarkdown += '| ' + Array(cols).fill('---').join(' | ') + ' |\n';

    // データ行
    for (let i = 0; i < rows; i++) {
      tableMarkdown += '| ' + Array(cols).fill('').join(' | ') + ' |\n';
    }

    return tableMarkdown.trim();
  }

  function parseTableCommand(content: string): { rows: number; cols: number } | null {
    const tableMatch = content.match(/^\/table\s+(\d+)\s+(\d+)$/);
    if (tableMatch && tableMatch[1] && tableMatch[2]) {
      const rows = parseInt(tableMatch[1]);
      const cols = parseInt(tableMatch[2]);
      if (rows > 0 && rows <= 20 && cols > 0 && cols <= 10) {
        return { rows, cols };
      }
    }
    return null;
  }

  return {
    generateTableMarkdown,
    parseTableCommand,
  };
}
