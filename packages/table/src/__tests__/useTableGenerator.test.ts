import { describe, it, expect } from 'vitest';
import { useTableGenerator } from '../index';

describe('useTableGenerator', () => {
  describe('generateTableMarkdown', () => {
    it('should generate a 2x2 table', () => {
      const { generateTableMarkdown } = useTableGenerator();

      const result = generateTableMarkdown(2, 2);

      expect(result).toContain('| Header1 | Header2 |');
      expect(result).toContain('| --- | --- |');
      expect(result.split('\n')).toHaveLength(4); // header + separator + 2 data rows
    });

    it('should generate a 3x3 table', () => {
      const { generateTableMarkdown } = useTableGenerator();

      const result = generateTableMarkdown(3, 3);

      expect(result).toContain('| Header1 | Header2 | Header3 |');
      expect(result).toContain('| --- | --- | --- |');
      expect(result.split('\n')).toHaveLength(5); // header + separator + 3 data rows
    });

    it('should generate a 1x1 table', () => {
      const { generateTableMarkdown } = useTableGenerator();

      const result = generateTableMarkdown(1, 1);

      expect(result).toContain('| Header1 |');
      expect(result).toContain('| --- |');
      expect(result.split('\n')).toHaveLength(3);
    });

    it('should return empty string for 0 rows', () => {
      const { generateTableMarkdown } = useTableGenerator();

      expect(generateTableMarkdown(0, 3)).toBe('');
    });

    it('should return empty string for 0 cols', () => {
      const { generateTableMarkdown } = useTableGenerator();

      expect(generateTableMarkdown(3, 0)).toBe('');
    });

    it('should return empty string for negative rows', () => {
      const { generateTableMarkdown } = useTableGenerator();

      expect(generateTableMarkdown(-1, 3)).toBe('');
    });

    it('should return empty string for negative cols', () => {
      const { generateTableMarkdown } = useTableGenerator();

      expect(generateTableMarkdown(3, -1)).toBe('');
    });

    it('should return empty string for rows > 20', () => {
      const { generateTableMarkdown } = useTableGenerator();

      expect(generateTableMarkdown(21, 3)).toBe('');
    });

    it('should return empty string for cols > 10', () => {
      const { generateTableMarkdown } = useTableGenerator();

      expect(generateTableMarkdown(3, 11)).toBe('');
    });

    it('should accept maximum valid values (20 rows, 10 cols)', () => {
      const { generateTableMarkdown } = useTableGenerator();

      const result = generateTableMarkdown(20, 10);

      expect(result).not.toBe('');
      expect(result.split('\n')).toHaveLength(22); // header + separator + 20 data rows
    });
  });

  describe('parseTableCommand', () => {
    it('should parse valid table command', () => {
      const { parseTableCommand } = useTableGenerator();

      const result = parseTableCommand('/table 3 4');

      expect(result).toEqual({ rows: 3, cols: 4 });
    });

    it('should parse table command with single digits', () => {
      const { parseTableCommand } = useTableGenerator();

      const result = parseTableCommand('/table 1 1');

      expect(result).toEqual({ rows: 1, cols: 1 });
    });

    it('should parse table command with max values', () => {
      const { parseTableCommand } = useTableGenerator();

      const result = parseTableCommand('/table 20 10');

      expect(result).toEqual({ rows: 20, cols: 10 });
    });

    it('should return null for invalid command format', () => {
      const { parseTableCommand } = useTableGenerator();

      expect(parseTableCommand('/table')).toBeNull();
      expect(parseTableCommand('/table 3')).toBeNull();
      expect(parseTableCommand('/table abc 3')).toBeNull();
      expect(parseTableCommand('table 3 4')).toBeNull();
      expect(parseTableCommand('/table 3 4 5')).toBeNull();
    });

    it('should return null for rows > 20', () => {
      const { parseTableCommand } = useTableGenerator();

      expect(parseTableCommand('/table 21 5')).toBeNull();
    });

    it('should return null for cols > 10', () => {
      const { parseTableCommand } = useTableGenerator();

      expect(parseTableCommand('/table 5 11')).toBeNull();
    });

    it('should return null for rows = 0', () => {
      const { parseTableCommand } = useTableGenerator();

      expect(parseTableCommand('/table 0 5')).toBeNull();
    });

    it('should return null for cols = 0', () => {
      const { parseTableCommand } = useTableGenerator();

      expect(parseTableCommand('/table 5 0')).toBeNull();
    });

    it('should return null for non-table content', () => {
      const { parseTableCommand } = useTableGenerator();

      expect(parseTableCommand('Regular text')).toBeNull();
      expect(parseTableCommand('# Heading')).toBeNull();
    });
  });
});
