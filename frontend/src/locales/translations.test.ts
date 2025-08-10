import { describe, expect, test } from 'vitest';
import { pluralize } from './translations';

describe('pluralize', () => {
  describe('English', () => {
    test('returns singular for count = 1', () => {
      expect(pluralize(1, 'en', 'taskWord', 'tasksWord')).toBe('task');
    });

    test('returns plural for count != 1', () => {
      expect(pluralize(2, 'en', 'taskWord', 'tasksWord')).toBe('tasks');
    });
  });

  describe('Russian', () => {
    test('returns singular for count = 1', () => {
      expect(pluralize(1, 'ru', 'taskWord', 'tasksWord', 'tasksWordMany')).toBe(
        'задача',
      );
    });

    test('returns plural for counts 2-4', () => {
      expect(pluralize(3, 'ru', 'taskWord', 'tasksWord', 'tasksWordMany')).toBe(
        'задачи',
      );
    });

    test('returns many form for counts >=5', () => {
      expect(pluralize(5, 'ru', 'taskWord', 'tasksWord', 'tasksWordMany')).toBe(
        'задач',
      );
    });
  });
});

