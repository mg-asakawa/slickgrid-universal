import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { SortDirectionNumber } from '../../enums/sortDirectionNumber.enum.js';
import { objectStringSortComparer } from '../objectStringSortComparer.js';

describe('the Object w/String SortComparer', () => {
  let collection: any[] = [];

  beforeEach(() => {
    collection = [
      { firstName: 'John', lastName: 'Z' },
      { firstName: 'Jane', lastName: 'Doe' },
      { firstName: 'Ava', lastName: null },
      { firstName: '', lastName: 'Cash' },
      { firstName: 'Bob', lastName: 'Cash' },
      { firstName: 'John', lastName: 'Doe' },
    ];
  });

  afterEach(() => {
    collection = undefined as any;
  });

  it('should throw an error when "dataKey" is missing in the column definition', () => {
    const direction = SortDirectionNumber.asc;
    const columnDef = { id: 'users', field: 'users' };

    expect(() => collection.sort((value1, value2) => objectStringSortComparer(value1, value2, direction, columnDef))).toThrow(
      'Sorting a "FieldType.object" requires you to provide the "dataKey"'
    );
  });

  it('should return original unsorted array when direction is undefined', () => {
    const direction = undefined;
    const columnDef = { id: 'users', field: 'users', dataKey: 'firstName' };

    collection.sort((value1, value2) => objectStringSortComparer(value1, value2, direction, columnDef));

    expect(collection).toEqual(collection);
  });

  it('should return an array of objects sorted ascending by their string content when valid objects are provided', () => {
    const direction = SortDirectionNumber.asc;
    const columnDef = { id: 'users', field: 'users', dataKey: 'firstName' };

    collection.sort((value1, value2) => objectStringSortComparer(value1, value2, direction, columnDef));

    expect(collection).toEqual([
      // entries with same firstName comes by order of entry in the array
      { firstName: '', lastName: 'Cash' },
      { firstName: 'Ava', lastName: null },
      { firstName: 'Bob', lastName: 'Cash' },
      { firstName: 'Jane', lastName: 'Doe' },
      { firstName: 'John', lastName: 'Z' },
      { firstName: 'John', lastName: 'Doe' },
    ]);
  });

  it('should return an array of objects sorted descending by their string content when valid objects are provided', () => {
    const direction = SortDirectionNumber.desc;
    const columnDef = { id: 'users', field: 'users', dataKey: 'firstName' };

    collection.sort((value1, value2) => objectStringSortComparer(value1, value2, direction, columnDef));

    expect(collection).toEqual([
      // entries with same firstName comes by order of entry in the array
      { firstName: 'John', lastName: 'Z' },
      { firstName: 'John', lastName: 'Doe' },
      { firstName: 'Jane', lastName: 'Doe' },
      { firstName: 'Bob', lastName: 'Cash' },
      { firstName: 'Ava', lastName: null },
      { firstName: '', lastName: 'Cash' },
    ]);
  });

  it(`should return an array with sorted characters showing at the beginning then comes the objects sorted ascending`, () => {
    const direction = SortDirectionNumber.asc;
    const columnDef = { id: 'users', field: 'users', dataKey: 'lastName' };
    collection.push('a');

    collection.sort((value1, value2) => objectStringSortComparer(value1, value2, direction, columnDef));
    expect(collection).toEqual([
      // entries with same LastName comes by order of entry in the array
      'a',
      { firstName: 'Ava', lastName: null },
      { firstName: '', lastName: 'Cash' },
      { firstName: 'Bob', lastName: 'Cash' },
      { firstName: 'Jane', lastName: 'Doe' },
      { firstName: 'John', lastName: 'Doe' },
      { firstName: 'John', lastName: 'Z' },
    ]);
  });

  it(`should return an array with sorted characters showing at the beginning then comes the objects sorted descending`, () => {
    const direction = SortDirectionNumber.desc;
    const columnDef = { id: 'users', field: 'users', dataKey: 'lastName' };
    collection.unshift('e');

    collection.sort((value1, value2) => objectStringSortComparer(value1, value2, direction, columnDef));
    expect(collection).toEqual([
      // entries with same LastName comes by order of entry in the array
      { firstName: 'John', lastName: 'Z' },
      { firstName: 'Jane', lastName: 'Doe' },
      { firstName: 'John', lastName: 'Doe' },
      { firstName: '', lastName: 'Cash' },
      { firstName: 'Bob', lastName: 'Cash' },
      { firstName: 'Ava', lastName: null },
      'e',
    ]);
  });
});
